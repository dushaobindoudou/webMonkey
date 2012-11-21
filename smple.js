var http = require('http');
var https = require("https");
var iconv = require("g:/node_app/server/iconv-lite/iconv-lite/index.js");
//http.createServer(function (req, res) {
//	res.writeHead(200, {'Content-Type': 'text/plain'});
//	res.end('Hello World\n');
//}).listen(1337, '127.0.0.1');
//console.log('Server running at http://127.0.0.1:1337/');
var fs = require('fs');
var path = require("path");
var basePath = 'i:/music_lrc';
var charset = "gbk";

var imagePaths = [];
//配置要搜索的html地址
var htmlUrls = [];
var baseAvNum = 1;
//已经保存歌手:刘德华，蔡依林，梁静茹，周杰伦(部分),王力宏，张学友,陶喆,林俊杰,刘若英,张惠妹,twins,崔子阁,高安,金志文,邓丽君,李晓杰,冷漠,张玮,平安
//王菲,杭娇,王心凌,许嵩,牛奶咖啡,郑智化,李丽芬,屠洪刚,高进,刀郎,那英,樱子,李代沫,张靓颖,SHE,群星,梁博,杨钰莹,Christina Aguilera,杨坤,关喆,沈春阳,黄雅莉
//梁静茹(未完),筷子兄弟,多亮,胡夏（未完）,萧敬腾,陈瑞,黄龄,徐良,李炜,李玉刚,张宇,降央卓玛,徐誉滕,萧亚轩,罗志祥,阿悄,Lady Gaga,吉克隽逸,梅艳芳,乌兰图雅,汪苏泷
//Beyond,朴树,任贤齐,Adele,李贵府,周华健,何洁,杨幂,张韶涵,邱永传,莫文蔚,小贱,龙梅子



//key word : 爱,l,的
var baseDomain = "http://www.5ilrc.com";//http://www.sifangbobo.info/html/part/index40.htmlhttp://www.sifangbobo.info/html/part/index40_2.html
var baseListPath = "/souge5.asp?Start=0&Offset=5020&gs_id=14036&radiobutton=jq&search=1";//http://www.youyouse.info/?/arthtml/47751.html
var testUrl = "http://www.sss6666.com/artlist/22_1.html";
var urlMark = "Song_";
var pageCharset = "hex";

var pageList = [];

var nameIncrease = 0;
var errorNum = 0;
var pageNum = 0;

var isUrl = function(str){
	str = str || "";
	return /^((http[s]{0,1}|ftp):\/\/)?[a-zA-Z0-9\.\-]+\.([a-zA-Z]{2,4})(\d+)?(\/[a-zA-Z0-9\.\-~!@#$%^&*+?:_\/=<>]*)?$/ig.test(str);
}

//过滤可用的页面列表
var filterContentUrl = function(ht){
	var aTags = ht.match(/(<a[^<>]+>)(((?!<\/a>)[\s\S])+)<\/a>/img);
	if(aTags && aTags.length){
		for(var i = 0, len = aTags.length; i < len; i++){
			var aTag = aTags[i];
			var href = aTag.match(/href\s*=\s*("|')([^'"]+)('|")/);
			if(href && href.length){
				var actUrl = href[2];
				if(actUrl){
					actUrl = actUrl.indexOf(urlMark) >=0 ? actUrl : "";
					if(actUrl){
						//纠正url
						if(actUrl.indexOf("http") >=0){
							actUrl = actUrl.substr(actUrl.lastIndexOf("http://"));
							console.log(actUrl);
							pageList.push(actUrl);
						}else{
							actUrl = baseDomain+actUrl;
							pageList.push(actUrl);
						}
						console.log(actUrl + "----已经加载到队列中！");
					}
				}
			}
		}
		//console.log(pageList);
	}
	//开始分析并保存LRC页面
	fileterSongLrc();
}

//保存歌词
var saveLrc = function(ht){
	var lrc = ht.match(/<td\sclass="text"\salign=left\s>(((?!<\/td>)[\s\S])+)<\/td>/img); 
	var dirPath = [];
	var lrcLs = [];
	if(lrc && lrc.length){
		for(var i = 0, len = lrc.length; i < len; i++){
			var aTag = lrc[i];
			var lc = aTag.match(/<br>(((?!<br>)[^<])+)/img);
			if(lc && lc.length){
				for(var j=0; j<lc.length; j++){
					var actLc = lc[j];
					actLc = actLc.match(/\[.+/img);
					if(actLc){
						console.log(actLc);
						lrcLs.push(actLc[0]+"\n");
						if(actLc[0].indexOf("ti") > -1){
							var ti = actLc[0].match(/:(.+)\]/);
							//ti = iconv.decode(,"gb2312");
							var now = new Date();
							dirPath[1] = ti ? (ti[1]+"-"+now.getTime() + ".lrc") : ("l" + "-"+now.getTime() +".lrc");
						}
						if(actLc[0].indexOf("ar") > -1){
							var ar = actLc[0].match(/:(.+)\]/);
							dirPath[0] = ar ? ar[1] :"l";
							//dirPath[0] = actLc[0];
						}
					}
				}
			}
		}
	}
	//console.log(lrcLs);
	//create new file and write in
	var desPath = path.join(basePath,dirPath.join("/"));
	var desDirPath = path.join(basePath,dirPath[0]);
	try{
		if(!fs.existsSync(desDirPath)){
			fs.mkdirSync(desDirPath);
		}
		console.log("保存的目的地址："+desPath);
		if(!fs.existsSync(desPath)){
			fs.appendFile(desPath,lrcLs.join(""),function(){
				console.log("文件保存："+desPath);
			});
			//fs.mkdirSync(desPath);
		}else{
			
		}
	}
	catch(e){
		console.log(e.message);
	}
}

//下载歌词页面 
var fileterSongLrc = function(){
	if(pageList.length < 1){
		console.log("待下载歌词页面数:" + pageList.length);
		//console.log("开始处理下一页！");
		//htmlPorcessOver();
		return;
	}
	try{
		for(var i =0,len= 3;i<len;i++){
			var url = pageList.shift();
			if(!url){
				//继续加载要么就完了
				//fileterSongLrc();
				return;
			}
			console.log("歌词页面正在下载：" + url);
			downLoadHtml(url,function(isSucc,ht){//处理列表页面，得到实际的图片内容页面
				if(isSucc){
					console.log("歌词页面下载完成：" + url);
					//downLoad Image
					if(ht){
						saveLrc(ht);
						//分析图片的地址
						//filterImgAddress(ht);
						//saveQueueImages();
						
					}
				}else{
					//filterImageUrl();
				}
				fileterSongLrc();
				pageNum++;
			});
		}
	}catch(e){
	}
	//继续过来列表
}

var filterImageUrl = function(){
	if(pageList.length < 1){
		console.log("待下载页面数:" + pageList.length);
		//console.log("开始处理下一页！");
		htmlPorcessOver();
		return;
	}
	var url = pageList.shift();
	if(!url){
		filterImageUrl();
		return;
	}
	console.log("正在下载：" + url);
	downLoadHtml(url,function(isSucc,ht){//处理列表页面，得到实际的图片内容页面
		if(isSucc){
			console.log("下载完成：" + url);
			//downLoad Image
			if(ht){
				//分析图片的地址
				filterImgAddress(ht);
				saveQueueImages();
			}
		}else{
			filterImageUrl();
		}
		pageNum++;
	});
}

var getNewUrl = function(){

}

var htmlPorcessOver = function(){
	if(baseAvNum > 117){
		return;
	}
	console.log(baseDomain + baseListPath);
	// 可以开始下一页了
	downLoadHtml(baseDomain + baseListPath,function(isSucc,ht){//处理列表页面，得到实际的图片内容页面
		console.log("列表页面加载完毕！");
		if(isSucc){
			//downLoad Image
			//saveQueueImages();
			if(ht){
				//分析页面拿到内容页面的地址
				filterContentUrl(ht);
				//fileterSongLrc(ht);
				console.log("当前加载到："+baseAvNum+"页面");
				console.log("待下载页面数:" + pageList.length);
				//filterImageUrl();
			}
		}else{
			//htmlPorcessOver();
		}
		pageNum++;
	});
	console.log("当前加载到："+baseAvNum+"页面");
	baseAvNum++;
}

var downLoadImage = function(url,complete){
	complete = complete || function(){};
	if(!url){
		complete(false);
		return;
	}
	var lastName = url.substr(url.lastIndexOf("/")+1);
	var ext = lastName.split(".");
	if(ext.length != 2){
		complete(false);
		return;
	}
	var extName = ext[1];
	extName = extName.match(/\w*/ig)[0];
	
	var request = null;
	if(url.indexOf("https") > -1 ){
		request = https.get(url, function(res){
			var imagedata = ''
			res.setEncoding('binary');
			if(res){
				
			}
			res.on('data', function(chunk){
				imagedata += chunk;
			});
			res.on('end', function(){
				if(!imagedata || imagedata.length < 10240){
					complete(false);
					return;
				}
				fs.writeFile(basePath + "/new_images/" + nameIncrease +"."+extName, imagedata, 'binary', function(err){
					if (err) throw err
					console.log("/new_images/" + nameIncrease +"."+extName + "-->已保存");
					nameIncrease++;
					complete(true);
				})
			});
		});
	}else{
		request = http.get(url, function(res){
			var imagedata = ''
			res.setEncoding('binary');
			if(res){
				
			}
			res.on('data', function(chunk){
				imagedata += chunk;
			});
			res.on('end', function(){
				if(!imagedata || imagedata.length < 10240){
					complete(false);
					return;
				}
				fs.writeFile(basePath + "/new_images/" + nameIncrease +"."+extName, imagedata, 'binary', function(err){
					if (err) throw err
					console.log("/new_images/" + nameIncrease +"."+extName + "-->已保存");
					nameIncrease++;
					complete(true);
				})
			});
		});
	}
	request.on("error",function(e){
		console.log('problem with request: ' + e.message);
		complete(false);
	});
	request.end();
}

var saveQueueImages = function(){
	var totalLen = imagePaths.length;
	var tmpLen = 0;
	if(!imagePaths || !imagePaths.length){
		//console.log("全部下载完毕！");
		console.log("开始处理下一个页面！");
		filterImageUrl();
		//htmlPorcessOver();
		return;
	}
	console.log("队列中的图片:" + totalLen);
	for(var i =0,len = 3; i<len;i++){
		var imgUrl = imagePaths.shift();
		downLoadImage(imgUrl,function(){
			saveQueueImages();
		});
	}
}

var filterImgAddress = function(html){
	imagePaths = [];//clear
	var imgs = html.match(/<img([^<>]+)\/?>/igm);
	if(!imgs || !imgs.length){
		console.log("没有匹配项！");
		return;
	}
	for(var i=0,len = imgs.length; i < len ; i++){
		if(!imgs[i]){
			continue;
		}
		var imgUrl = imgs[i].match(/((http[s]{0,1}|ftp):\/\/)?[a-zA-Z0-9\.\-]+\.([a-zA-Z]{2,4})(\d+)?(\/[a-zA-Z0-9\.\-~!@#$%^&*+?:_\/=<>]*)?/ig);
		if(imgUrl){
			console.log(imgUrl[0]);
			imagePaths.push(imgUrl[0]);
		}
	}
}

var downLoadHtml = function(url,complete){
	complete = complete || function(){};
	if(!isUrl(url)){
		complete(false);
		return;
	}
	var rst = http.get(url,function(res){
		//res.setEncoding(pageCharset);
		//var buf = new Buffer();
		var ht = "";
		res.on('data', function (chunk) {
			if(chunk){
				//var len = buf.length;
				//buf.write(len,chunk);
				//console.log(chunk);
				ht += iconv.decode(chunk,charset);
				//console.log(ht);
				//return;
				//filterImgAddress(chunk);
			}
		});
		res.on("end",function(chunk){
			//filterImgAddress(ht);
			// iconv("gb2312", "utf-8",file_get_contents($url));
			complete(true,ht);
		});
	});
	rst.on("error",function(){
		//complete(false);
	});
	rst.end();
}

fs.exists(basePath + 'new_images',function(isExists){
	if(isExists){
		return;
	}
	fs.mkdirSync( basePath + 'new_images',function(ok){
		if(ok){
			console.log("mk created!");		
		}
	});
});

htmlPorcessOver();

/*fs.readdir(basePath + 'images',function(err,files){
	for(var i =0,len = files.length; i< len;i++){
		var exts = files[i].split(".");
		var extName = exts.length > 1 ? exts[1] : "jpg" 
		fs.rename( basePath + "images/" + files[i], basePath + "new_images/" + i + "." + extName, function(err){
		  if(err) console.log(err);
		  console.log("moved");
		});
		/*fs.open(basePath + "images/" + files[i], "r+", function(err,fd){
			if(err){
				throw err;
			}
			console.log(fd);			
		})*/
		//fs.read
		//console.log(files[i]);
	//}
//});*/
/*
var options = {
  host: 'www.baidu.com',
  port: 80,
  path: '/',
  method: 'GET'
};
var isMoved = false;

var req = http.request(options, function(res) {
  console.log('STATUS: ' + res.statusCode);
  if(res.statusCode && (res.statusCode == '302' || res.statusCode == '301')){
	//isMoved = true;
	http.get(res.headers.location,function(res){
		console.log('header:' + JSON.stringify(res.headers));
		res.on('data',function(chunck){
			console.log("body:\n"+chunck);
		});
	})
	return;
  }
  console.log('HEADERS: ' + JSON.stringify(res.headers));
  res.setEncoding('utf8');
  res.on('data', function (chunk) {
	if(isMoved){
		
	}else{
		console.log('BODY: ' + chunk);
	}
  });
  //console.log();
});

req.on('error', function(e) {
  console.log('problem with request: ' + e.message);
});

// write data to request body
req.write('data\n');
req.write('data\n');
req.end();*/




