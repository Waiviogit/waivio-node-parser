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


