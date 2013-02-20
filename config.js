
var config = {
	host:"www.top100.cn",
	path:'/artist/info-agr4depb38r.shtml',
	charset:"utf-8",
	method:'GET',
	saveDir:"../songs",
	steps:[{
		addNext:{
			reg:/<a[^>]+class="down"[^>]+>/img,
			isFilterSaveTask:true,
			arrange:function(currStep,task){
				var tagTasks = [];
				if(!task){
					return;
				}
				var tmpTask = [],resTask = [];
				var trimArrayItemFirstFlag = function(arrayStr) {
					var arrayList = arrayStr.split(',');
					for (var i = 0; i < arrayList.length; i++) {
						arrayList[i] = arrayList[i].substring(1);
					}
					return arrayList.join(',');
				}
				var getUrl = function(productids){
					return "/download/download.php?Productid=" + trimArrayItemFirstFlag(productids);
				}
				for(var i=0,len = task.length; i < len; i++){
					var tt = task[i].match(/href="(?:[^"]+)"/i);
					if(tt){
						tmpTask = tmpTask.concat(tt);
					}
				}
				tmpTask = tmpTask.filter(function(elem, pos, self) {
					return self.indexOf(elem) == pos;
				});
				tmpTask.forEach(function(v,i){
					var tt = v.match(/'([^']+)'/);
					if(tt && tt[1]){
						resTask.push({url:getUrl(tt[1])});
					}
				});
				
				return resTask;
			}
		}},{
		addNext:{
			reg:/<ul[^>]+class="Listen_downloadtop2[^>]+>(?:(?!<\/ul>)[\s\S])+<\/ul>/img,
			isFilterSaveTask:true,
			arrange:function(currStep,task){
				var tagTasks = [];
				if(!task){
					return;
				}
				console.log(task);
				var tmpTask = [];
				for(var i=0,len = task.length; i < len; i++){
					var songInfo = {};
					
					var songName = task[i].match(/<li[^>]class="No2">(?:(?!<\/li>).)+/igm);//歌名
					var songer = task[i].match(/<li[^>]class="No3">(?:(?!<\/li>).)+/igm);//歌手
					var url = task[i].match(/<li[^>]class="No6">(?:(?!<\/li>).)+/igm);//url 下载链接
					
					console.log(songName);
					songName = songName && songName[0];
					songName = songName.match(/<a[^>].+[^>]>(.+)<\/a>/i);
					
					songName = songName && songName[1];
					
					songer = songer && songer[0];
					songer = songer.match(/<a[^>].+[^>]>(.+)<\/a>/i);
					songer = songer && songer[1];
					
					url = url && url[0];
					url = url.match(/href="([^"]+)"/i);
					url = url && url[1];
					
					if(url){
						tmpTask = tmpTask.concat({url:url,songger:songer,songName:songName});
					}
				}
				return tmpTask;
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
