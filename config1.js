
var config = {
	host:"www.xiumei.com",
	path:'/gallery/gallery/',
	charset:"utf-8",
	method:'GET',
	saveDir:"../imgs",
	steps:[{
		addCurrent:{
			reg:/<div class="page">(?:(?:(?!<\/div>)[\s\S])+)<\/div>/img,
			isFilterSaveTask:true,
			arrange:function(currStep,task){
				var tagTasks = [];
				if(!task){
					return;
				}
				var tmpTask = [],resTask = [];
				for(var i=0,len = task.length; i < len; i++){
					var tt = task[i].match(/href="(?:[^"]+)"/igm);
					if(tt){
						tmpTask = tmpTask.concat(tt);
					}
				}
				tmpTask = tmpTask.filter(function(elem, pos, self) {
					return self.indexOf(elem) == pos;
				});
				tmpTask.forEach(function(v,i){
					var tt = v.match(/href="([^"]+)"/);
					if(tt && tt[1]){
						resTask.push({url:tt[1]});
					}
				});
				return resTask;
			}
		},
		addNext:{
			reg:/<img[^>]+>/img,
			arrange:function(nextStep,task){
				var tagTasks = [];
				if(!task){
					return;
				}
				for(var i=0,len = task.length; i < len; i++){
					var tt = task[i].match(/src="([^"]+)"/);
					if(tt && tt[1]){
						tagTasks.push({url:tt[1]},tag:);
					}
				}
				return tagTasks;
			}
		}},
		{
			isSaved:true,
			addCurrent:{
				reg:/<img[^>]+>/img,
				arrange:function(){
					//save images;
					
					
				}
			}
		}
	]
};

module.exports = config;
