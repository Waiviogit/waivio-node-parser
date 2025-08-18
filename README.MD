### Waivio Node Parser

Parses the Hive blockchain and writes data to MongoDB, while coordinating with Redis for state and background jobs. It handles Hive on-chain operations and Waivio guest actions, and provides a task runner ecosystem for maintenance/reindex jobs.

- **Hive stream ingestion**: comments, custom_json, votes, transfers, vesting, account updates, delegations, reward claims, savings, witness votes
- **Guest actions**: follow, votes, bell notifications, website admin actions, Ads/Canonical, referrals, Hive-Engine withdraws, etc.
- **Redis-backed state**: last processed block, TTL-driven actions, caches, queues
- **Sentry tracing** and error capture
- **Tasks**: a set of runnable utilities for data backfills, maintenance, and recalculations

Repository home: `https://github.com/Waiviogit/waivio-node-parser`

---

### Architecture (high level)

- `bin/service.js`: HTTP server bootstrap, graceful shutdown, reads `config.port`
- `app.js`: initializes Sentry, starts the Hive stream (`runStream()`), and a Redis TTL listener
- `processor/processor.js`:
  - calls `api/general.getBlockNumberStream(...)` to stream blocks
  - dispatches transactions to `parsers/mainParser.parseSwitcher`
- `api/general.js`: block stream loader; switches between live RPC and REST (`account_history_api.get_ops_in_block`) for votes-only mode; round-robins Hive nodes on failure
- `parsers/mainParser.js`: routes ops to specific parsers based on `MAIN_OPS` and `CUSTOM_JSON_OPS`; supports `parseOnlyVotes` fast-path
- `database/index.js`: connects to Mongo via Mongoose and exports all models
- `utilities/redis/*`: Redis clients, pub/sub of Redis key-expiration events, helpers, and restoration utilities
- `utilities/jobs/*`: background cron-like jobs (e.g., price info)
- `constants/*`: operation maps, app data, redis keys, etc.

No public HTTP API is exposed by default; the HTTP server exists for lifecycle and tracing. This service is designed to run as a background worker.

---

### Prerequisites

- Node.js 20+
- MongoDB (matching the `config/config.json` database per env)
- Redis (with keyspace notifications enabled for expirations)

Windows is supported (PowerShell works fine).

---

### Quickstart (local)

1) Install dependencies
```bash
npm install
```

2) Set environment variables (PowerShell example). Create a `.env.local` for your shell or set inline when running:
```powershell
$env:NODE_ENV = "development"
$env:MONGO_URI_WAIVIO = "mongodb://localhost:27017/waivio"
$env:REDISCLOUD_URL = "redis://127.0.0.1:6379"
# Optional/feature flags
$env:START_FROM_CURRENT = "true"   # start from blockchain head
$env:RESTORE_REDIS = "false"       # rebuild redis caches from DB on boot
$env:PARSE_ONLY_VOTES = "false"    # votes-only mode using REST ops-in-block
```

3) Run the service
```bash
npm run start
```

The process will connect to Mongo, begin consuming Hive blocks, and listen to Redis TTL events.

---

### Configuration

- Static defaults: `config/config.json` (per `NODE_ENV`) for Mongo and Redis DB indexes
- Dynamic/overrides: `config/index.js` merges environment variables and computed URLs for Waivio services

Key env vars (all are optional unless noted):

| Variable | Purpose | Default/Notes |
|---|---|---|
| `NODE_ENV` | runtime environment | `development` |
| `PORT` | HTTP server port | `3003` |
| `MONGO_URI_WAIVIO` | Mongo connection string | built from `config/config.json` if unset |
| `REDISCLOUD_URL` | Redis connection URI | required for main clients |
| `SENTRY_DNS` | Sentry DSN | optional |
| `API_KEY` | internal API key for outbound calls | optional |
| `NGINX_KEY` | Nginx service key | optional |
| `SERVICE_API_KEY` | Waivio service API key | optional |
| `APP_NAME` | app name used in logic | `waiviodev` |
| `MASTER_ACCOUNTS` | CSV of master accounts | `waivio,waivio.affiliate` |
| `CAN_MUTE_GLOBAL` | CSV of allowed global muters | empty |
| `START_FROM_CURRENT` | start from chain head | `false` |
| `START_FROM_BLOCK` | numeric start block | unset |
| `RESTORE_REDIS` | rebuild Redis caches on boot | `false` |
| `PARSE_ONLY_VOTES` | stream only vote ops via REST | `false` |
| `DYNAMIC_HASHTAGS` | enable dynamic tag feature | `false` |
| `GUEST_HOT_ACC` | hot account for guest withdrawals | required in prod for engine withdraws |
| `GUEST_HOT_KEY` | active key for the hot account | required in prod for engine withdraws |

Related service endpoints are generated per env (Waivio API, Notifications API, Nginx, Object Import Service). See `config/index.js` for host and route details.

Redis DB index mapping comes from `config/config.json`:

```json
{
  "redis": {
    "wobjectsRefs": 1,
    "lastBlock": 2,
    "actionsQueue": 3,
    "expiredPosts": 8,
    "tagCategories": 9,
    "mainFeedsCache": 10
  }
}
```

Ensure Redis keyspace notifications are enabled for expiration events (the code sends `CONFIG Ex` to configure the subscriber).

---

### Run modes

- **Normal**: parse all ops, use direct RPC for `get_block`
- **Votes-only** (`PARSE_ONLY_VOTES=true`):
  - fetch ops via REST `account_history_api.get_ops_in_block`
  - throttle progression to remain behind the main parser (by ~3 blocks)

Start block control:
- `START_FROM_CURRENT=true` starts from head
- `START_FROM_BLOCK=<num>` starts from a specific block
- otherwise continues from Redis `last_block_num`

Redis restore:
- `RESTORE_REDIS=true` runs `restoreRedisHelper.restore()` to rebuild caches before starting the stream

---

### Parsers (high level coverage)

`constants/parsersData.js` defines the op map:

- Main chain ops: `comment`, `delete_comment`, `custom_json`, `account_update`, `account_update2`, `create_claimed_account`, `account_create`, `vote`, `account_witness_vote`, `transfer`, `delegate_vesting_shares`, `withdraw_vesting`, `set_withdraw_vesting_route`, `transfer_to_vesting`, `change_recovery_account`, `transfer_from_savings`, `claim_reward_balance`
- Waivio custom_json ops: guest updates/votes/follows/reblogs/bell, website admin ops, append votes, hide/unhide, referrals, ads/canonical, Hive-Engine (`waivio_hive_engine`), etc.

Redis-expiration listener reacts to TTL events to expire posts/comments and to start/end object promotions.

---


### Docker

Build and run:
```bash
docker build -t waivio-node-parser .
docker run --rm \
  -e NODE_ENV=development \
  -e MONGO_URI_WAIVIO=mongodb://host.docker.internal:27017/waivio \
  -e REDISCLOUD_URL=redis://host.docker.internal:6379 \
  -e START_FROM_CURRENT=true \
  -p 3003:3003 \
  waivio-node-parser
```

Note: point Mongo/Redis to reachable hosts (e.g., `host.docker.internal` on Windows/Mac).

---

### Testing

```bash
npm test
```

The test runner sets `NODE_ENV=test`. Ensure test DB and Redis are available per `config/config.json`.

---

### Troubleshooting

- Stuck behind main parser in votes-only mode: by design it trails the main parser by ~3 blocks
- Node errors or empty blocks: the stream auto-rotates through `constants/appData.js#HIVED_NODES`
- Redis expirations not firing: enable keyspace notifications (the app attempts `CONFIG Ex` for the subscriber)
- Sentry not collecting: set `SENTRY_DNS`

---

### License

MIT
