
/*
 
 简单的抓取文件的脚本
 不支持https
 
 这个不好，socket 要重用,todo:优化
 
*/

var fs = require('fs');
var http = require('http');
var url = require('url');
var path = require('path');
var HtmlEncode = require('./htmlEncode').Encoder;
var globalAgent = http.globalAgent;

//判断是否是函数
var isFunction = function(obj){
	return Object.prototype.toString.call(obj) === "[object Function]";
};
//判断是否是数组
var isArray = function(obj){
	return Object.prototype.toString.call(obj) === "[object Array]";
};
//判断是否是字符串
var isString = function(obj){
	return Object.prototype.toString.call(obj) === "[object String]";
};
//判断是否是正则表达式
var isRegExp = function(obj){
	return Object.prototype.toString.call(obj) === "[object RegExp]"; 
};
var WebMonkey = function(options){
	if(!options || !options.host || !options.steps){
		throw new Error('config file error!');
	}
	this.connections = options.connections || 5;
	this.steps = options.steps;
	this.charset = options.charset || "utf-8";
	this.saveDir = options.saveDir || "";
	this.currentExecStep = null;
	this.currentTask = null;//当前执行的任务
	
	this.finalTask = null;//最终任务
	this.errorList = [];//错误信息
	
	this.method = options.method || "GET";
	this.method = this.method.toUpperCase();
	this.host = options.host;
	this.path = options.path || "/";
	this.port = options.port || "80";
	//this.url = options.url || "";//请求的地址
	this.currentConnectons = 0;
	this.init(options);
};


WebMonkey.prototype = {
	constructor:WebMonkey,
	init:function(opts){
		this.checkConfig(opts.steps);
		this.requestData({
			host:this.host,
			port:this.port,
			method:this.method,
			path:this.path,
			agent:false
		});
	},
	checkConfig:function(cfg){
		if(!isArray(cfg)){
			throw new Error("配置不正确!");
		}
		var isPassed = true;
		var idx = [];
		cfg.forEach(function(v,i){
			var tempStemp = null;
			if(v.addCurrent){
				tempStemp = v.addCurrent;
				if(!isRegExp(tempStemp.reg)){
					isPassed = false;
					idx.push(i+"addCurrent");
					return;
				}
			};
			if(v.addNext){
				tempStemp = v.addNext;
				if(!isRegExp(tempStemp.reg)){
					isPassed = false;
					idx.push(i+":addNext");
					return;
				}
			};
			v.tasks = isArray(v.tasks)? v. tasks : [];
			v.processedTasks = isArray(v.processTasks) ?  v.processTasks : [];
		});
		if(!isPassed){
			throw new Error("no pass "+(idx.join(","))+"reg check!");
		}
		if(!this.host){
			console.log("host 必须有的");
		}
		if(!fs.existsSync(this.saveDir)){
			fs.mkdirSync(this.saveDir);
		}
	},
	setTasks:function(chunk){
		var step = this.getUncompletedStep();
		if(!step || !step.sp){
			console.log("last step!");
			return;
		}
		this.dispatchTask(chunk,step);
	},
	dispatchTask:function(chunk,step){
		var currentStep = step.sp;
		var nextStep = this.steps[step.idx+1];
		if(currentStep.addCurrent){
			//current level step.idx
			this.execTask(currentStep.addCurrent,currentStep,chunk);
		}
		if(currentStep.addNext){
			//next level
			this.execTask(currentStep.addNext,nextStep,chunk);
		}
	},
	execTask:function(stepAct,step,chunk){
		if(!step){
			console.log("no task to do!");
			return;
		}
		var newTask = null;
		if(!isString(chunk)){
			console.log('no chunk or saving!');
		}else{
			newTask = chunk.match(stepAct.reg);
		}
		if(!isFunction(stepAct.arrange)){
			return;
		}
		var tsks = stepAct.arrange.call(this,stepAct,newTask);
		if(tsks){
			this.addTask(tsks,step);
		}
	},
	getUncompletedStep:function(){
		for(var i=0,len = this.steps.length; i < len; i++){
			if(this.steps[i] && !this.steps[i].isDone){
				return {idx:i,sp:this.steps[i]};
			}
		};
	},
	getOneTask:function(){
		if(!this.currentExecStep || this.currentExecStep.sp.isDone){
			this.currentExecStep = this.getUncompletedStep();
		}
		if(!this.currentExecStep || !this.currentExecStep.sp){
			if(this.finalTask){
				this.writeLog(JSON.stringify(this.finalTask.processedTasks));
			}
			console.log("步骤执行完成结束战斗!");
			return -1;
		}
		var stepInfo = this.currentExecStep.sp;
		var nextAct = null,tmpRef = null;
		if(stepInfo.tasks.length < 1){
			stepInfo.isDone = true;
			return;
		}
		tmpRef = nextAct = stepInfo.tasks.pop();
		//stepInfo.processedTasks.push(tmpRef);//暂时不要装进去 因为还没有下载完成
		if(!isString(nextAct)){
			nextAct = nextAct.url;
		}
		var urlParam = url.parse(nextAct);
		if(stepInfo.isSaved){
			if(!this.finalTask){
				this.finalTask = stepInfo;
			}
			urlParam.isSaved = true;
		};
		urlParam.taskRef = tmpRef;
		return urlParam;
	},
	requestData:function(params){
		//this.currentConnectons++;
		var that = this;
		var newTsk = null;
		if(!params){
			newTsk = that.getOneTask();
			if(newTsk === -1){
				console.log("over loaing!");
				return;
			}
			if(!newTsk){
				that.requestData.call(that);//继续下一个
				return;
			}
			params = {};
			params.host = (newTsk.host || this.host);
			params.port = this.port;
			params.method = this.method;
			params.path = (newTsk.path || this.path);
			params.agent = false;
			params.isSaved = newTsk.isSaved;
			params.taskRef = newTsk.taskRef;
		}
		var req = null;
		console.log("loading : "+params.path);
		try{
			if(params.isSaved){
				console.log("saving : " + params.path);
				req = http.request(params,function(res){
					var statusCode = res.statusCode;
					//20MB
					var fileName = that.getFileName(params.path);
					var savedPath = path.join(that.saveDir,fileName.fileName+"."+fileName.ext);
					var ws = fs.createWriteStream(savedPath,{
						flags: 'a'
					});
					if(statusCode == 200 || statusCode == 206 ){
						res.on("data",function(chunk){
							ws.write(chunk);
							console.log(fileName.fileName+"."+fileName.ext + " downing:" + chunk.length/1024 +"kb");
						});
						res.on("end",function(){
							ws.end();
							//console.log(fileName.fileName+"."+fileName.ext+" saved!");
							params.taskRef.savedPath = savedPath;
							that.addProcessedTask(params.taskRef);
							that.setTasks.call(that,null);
							//怎么知道是不是该保存数据了呢
							that.requestData.call(that);
							//that.requestData.call(that);
						});
						return;
					}
					if(statusCode == 301 || statusCode == 302 || statusCode == 201){
						//重新添加
						if(res.headers.location){
							console.log(fileName.fileName+"."+fileName.ext + " 重新加入任务:" + res.headers.location);
							params.taskRef.url = res.headers.location;
							console.log(params.taskRef);
							that.reCurrAddStep(params.taskRef);
						}
						console.log("request new conent");
					}
					console.log("状态码："+statusCode);
					that.requestData.call(that);//继续下一个请求
				});
			}else{
				req = http.request(params,function(res){
					var statusCode = res.statusCode;
					res.setEncoding("utf-8");
					//20MB
					var requestHtml = "";
					if(statusCode == 200 || statusCode == 206 ){
						res.on("data",function(chunk){
							requestHtml += chunk;
						});
						res.on("end",function(){
							that.addProcessedTask(params.taskRef);
							that.setTasks.call(that,requestHtml);
							that.requestData.call(that);
						});
						return;
					}
					if(statusCode == 301 || statusCode == 302 || statusCode == 201){
						if(res.headers.location){
							console.log(res.headers.location);
						}
						params.taskRef.url = res.headers.location;
						that.reCurrAddStep(params.taskRef);
						console.log("request new conent");
					}
					console.log("状态码："+statusCode);
					that.requestData.call(that);
				});
			}
			req.on("error",function(e){
				that.addError({err:e,path:params.path});
				that.requestData.call(that);
			});
			req.end();
		}catch(e){
			that.addError({err:e,path:params.path});
			//保存状态
			console.log(e);
			this.saveErrorInfo();
			that.requestData.call(that);
		}
	},
	isUrlInTask:function(ele,task){
		if(!ele || !isString(ele.url) || !isArray(task)){//tag 没有url 字段的全部 删掉
			return -1;
		}
		for(var i=0,len = task.length; i < len; i++){
			if(task[i] && task[i].url == ele.url){
				return i;;
			}
		};
		return -1;
	},
	decodeHtml:function(hte){
		var hd = new HtmlEncode("entity");
		if(!hte){
			return;
		}
		return hd.htmlDecode(hte);
	},
	decodeTasksUrl:function(tasks){
		if(!isArray(tasks)){
			return;
		}
		var that = this;
		tasks.forEach(function(v,i){
			if(!v.url){
				return;
			}
			v.url = that.decodeHtml(v.url);
		});
		return;
	},
	filterTasks:function(tasks){
		if(!isArray(tasks)){
			return;
		}
		var that = this;
		tasks = tasks.filter(function(ele,i){
			var status = that.isUrlInTask(ele,tasks);
			if(status > -1 && status != i){
				return false;
			}else{
				return true;
			}
		});
		return tasks;
	},
	addTask:function(tasks,step){
		if(!step.tasks){
			step.tasks = [];
		}
		if(!step.processedTasks){
			step.processedTasks = [];
		}
		var that = this;
		that.decodeTasksUrl(tasks);
		tasks = that.filterTasks(tasks);
		tasks = tasks.filter(function(ele,i){
			var status = that.isUrlInTask(ele,step.processedTasks);
			if(status > -1){
				return false;
			}else{
				return true;
			}
		});
		tasks = tasks.filter(function(ele,i){
			var status = that.isUrlInTask(ele,step.tasks);
			if(status > -1){
				return false;
			}else{
				return true;
			}
		});
		step.tasks = step.tasks.concat(tasks);
	},
	getFileName:function(url){
		if(!url){
			return;
		}
		var fileName = url.substr(url.lastIndexOf('/') + 1);
		var ext = "";
		var lastQueryIdx = -1;
		var lastDotIdx = fileName.indexOf(".");
		if(lastDotIdx > -1){
			ext = fileName.substr(lastDotIdx + 1);
			ext = ext.replace(/#/ig,"");
			fileName = fileName.substring(0,lastDotIdx);
		}
		lastQueryIdx = ext.indexOf("?");
		if(lastQueryIdx > - 1){
			ext = ext.substring(0,lastQueryIdx);
		}
		lastQueryIdx = -1;
		lastQueryIdx = fileName.indexOf("?");
		if(lastQueryIdx > - 1){
			fileName = fileName.substring(0,lastQueryIdx);
		}
		fileName = fileName.replace(/#/ig,"");
		if(!fileName){
			fileName = (new Date()).getTime();
		}
		return{
			fileName:decodeURIComponent(fileName),
			ext:ext
		}
	},
	reCurrAddStep:function(task){
		if(!this.currentExecStep || !this.currentExecStep.sp){
			//todo:可能会有问题
			return;
		}
		this.addTask([task],this.currentExecStep.sp);
	},
	addProcessedTask:function(task){
		if(!this.currentExecStep || !this.currentExecStep.sp){//没有生成执行任务时，不执行添加动作
			//todo:可能会有问题
			return;
		}
		this.currentExecStep.sp.processedTasks.push(task);
	},
	writeLog:function(content){
		if(!content){
			return;
		}
		var logPath = path.join(this.saveDir,(new Date()).getTime()+"_log.log");
		fs.writeFile(logPath,content,function(e,v){
			if (e) throw e;
			console.log(logPath + '\t\t\t log saved success!');
		});
	},
	saveStatus:function(){
		var content = JSON.stringify(this.steps);
		var logPath = path.join(this.saveDir,(new Date()).getTime()+"_status.task");
		fs.writeFile(logPath,content,function(e,v){
			if (e) throw e;
			console.log(logPath + '\t\t\t log saved success!');
		});
	},
	addError:function(e){
		this.errorList.push({
			errorInfo:e,
			time:(new Date()).getTime()
		});
	},
	saveErrorInfo:function(){
		var content = JSON.stringify(this.errorList);
		var logPath = path.join(this.saveDir,(new Date()).getTime()+"_error.er");
		fs.writeFile(logPath,content,function(e,v){
			if (e) throw e;
			console.log(logPath + '\t\t\t log saved success!');
		});
	}
};



module.exports = function(options){
	return new WebMonkey(options);
}