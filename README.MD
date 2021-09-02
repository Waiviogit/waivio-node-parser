 #  Waivio-node-parser README

[![N|Solid](https://www.waivio.com/images/icons/waivio-logo.svg)](https://www.waivio.com)


This service designed to collect and write information from the blockchain Steam to the database

  - Collect data from guest users
  - Collect data from steem users(posts, comments, votes, etc.)
  - Added the ability to connect third-party tasks for the parser

# Running third-party scripts through PM2!


To start the task associated with the parser, you must:

  - Make script for this task with own parser(switcher)
  - Add run script to package.json 
  - Start process with pm2 by: pm2 start --name <nameOfTask> npm -- run <scriptName> [params] --


#Nodes & response time

'https://blocks.waivio.com'  production ~40ms staging 300-500ms **(now only for blocks)**

'https://anyx.io' production ~40-50ms staging 270-500ms

'https://api.hive.blog' production ~30-80ms staging 270-600ms

'https://rpc.ecency.com'  production ~100-200ms staging 30-80ms

'https://api.pharesim.me' production ~250-500ms staging 30-50ms

'https://api.openhive.network' production ~300-400ms staging 30-70ms

'https://rpc.esteem.app' production ~350-600ms  staging 40-90ms

'https://hive-api.arcange.eu' production ~ 230-400ms staging 40-100ms

'https://hive.roelandp.nl' production ~300-600ms staging 90-200ms

'https://rpc.ausbit.dev' production ~400-700ms staging 90-180ms


