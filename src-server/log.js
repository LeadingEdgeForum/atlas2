/* Copyright 2014 Krzysztof Daniel

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.*/


var log4js = require('log4js');
var fs = require('fs');
fs.mkdir('logs', function ignore (err) {
});

log4js.configure({
  appenders: {
    console: {
      type: 'console'
    },
    mainFile: {
      type: 'file',
      filename: 'logs/wardleymaps.log'
    }
  },
  categories: {
    default: {
      appenders: ['console', 'mainFile'],
      level: 'ALL'
    },
		MapSchema : {
			appenders: ['console', 'mainFile'],
      level: 'ERROR'
		},
    NodeSchema : {
      appenders: ['console', 'mainFile'],
      level: 'ERROR'
    },
    NodeRemoval : {
      appenders: ['console', 'mainFile'],
      level: 'ERROR'
    },
		variants : {
			appenders: ['console', 'mainFile'],
      level: 'error'
		},
		deduplication : {
			appenders: ['console', 'mainFile'],
      level: 'WARN'
		},
		submap : {
			appenders: ['console', 'mainFile'],
			level: 'DEBUG'
		},
		renderer : {
			appenders: ['console', 'mainFile'],
			level: 'WARN'
		},
    capability : {
      appenders: ['console', 'mainFile'],
      level: 'ERROR'
    },
    access : {
      appenders: ['console', 'mainFile'],
      level: 'ERROR'
    }
  }
});


module.exports = log4js;
