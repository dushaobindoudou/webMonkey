//这个是抓取的配置文件
//会根据process内容一一直向下走知道，最后一个保存文件

//todo：这是一个线性的，如何添加循环分支
var monkeyConfig = {
	siteDomain:"",//要抓取网站的域名
	sitePath:"",//建议提供一个路径，如果没有路径的话默认是index页面
	savePath:"",//抓取的内容保存的位置,
	nameRaul:"",//内容的命名规则
	process:[{
		filterRegex:"",//过滤内容的正则表达式,如果需要向下走，这个必须是一个路径，或者一个超链接，如果不是超链接(可读的比较html,text,xml)，或者路径,如果是img类型的话直接保存
		saveRegex:"",//保存内容的正则
		isCircle:"",//标志是否循环查找
		isSave:"",//标志是否保存文件
	}]
}