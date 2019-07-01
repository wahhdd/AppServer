var express = require('express');
var http = require('http');
var fs = require('fs');
var app = express();
var multer = require('multer');
var path = require('path');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
const querystring = require('querystring');
var url = "mongodb://localhost:27017/";
var objectId = require('mongodb').ObjectId;

var urlencodedParser = bodyParser.urlencoded({
	extended: false
})
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'data')));

app.all('*', function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header('Access-Control-Allow-Headers', 'Content-type');
	res.header("Access-Control-Allow-Methods", "PUT,POST,GET,DELETE,OPTIONS,PATCH");
	res.header('Access-Control-Max-Age', 1728000); //预请求缓存20天
	next();
});

app.post("/api/Upload", multer({
      //设置文件存储路径
     dest: 'data/img'   //upload文件如果不存在则会自己创建一个。
 }).single('imgUploader'), function (req, res, next) {
    if (req.file.length === 0) {  //判断一下文件是否存在，也可以在前端代码中进行判断。
        res.render("error", {message: "上传文件不能为空！"});
        return
    } else {
       let file = req.file;
       fs.renameSync('./data/img/' + file.filename, './data/img/' + file.originalname);//这里修改文件名字，比较随意。
		
       // 设置响应类型及编码
       res.set({
         'content-type': 'application/json; charset=utf-8'
      });
       res.end('http://192.168.43.60:3000/img/'+file.originalname);
    }
});
app.post('/jiudian', function(req, res, next) {
	MongoClient.connect(url, {
		useNewUrlParser: true
	}, function(err, db) {
		if(err) throw err;
		var dbo = db.db("yundong");
		var whereStr = {};
		dbo.collection("guanzhu1").find(whereStr).toArray(function(err, result) {
			if(err) throw err;
			res.send(result);
			db.close();
		});
	});
});
app.get('/qiandao', function(req, res, next) {
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	  if (err) throw err;
	  var dbo = db.db("yundong");
	  var whereStr = req.query;  // 查询条件
	  var id = new objectId(whereStr._id);
	  var num=parseInt(whereStr.qiandaotianshu),jin=parseInt(whereStr.jinbi);
	  var updateStr = {$set: { "qiandaotianshu" :num }};
	  if(num==7){
		 num=0;
		  whereStr.jinbi+=7;
		  updateStr = {$set: { "qiandaotianshu" :num },$set: { "jinbi" :jin }};
	  }
	  dbo.collection("user").updateOne({_id:id}, updateStr, function(err, result) {
	     if (err) throw err;
	     res.end(whereStr.jinbi)
	     db.close();
	 });
	});
});
app.get('/shipin', function(req, res, next) {
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	  if (err) throw err;
	  var dbo = db.db("yundong");
	  var whereStr = req.query;  // 查询条件
	  dbo.collection("shipin").find(whereStr).limit(4).toArray(function(err, result) {
		  if (err) throw err;
		  res.end(JSON.stringify(result))
		  db.close();
	  });
	});
});
app.get('/shiping', function(req, res, next) {
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	  if (err) throw err;
	  var dbo = db.db("yundong");
	  var whereStr = new objectId(req.query._id);  // 查询条件
	  dbo.collection("shipin").findOne({_id:whereStr},function(err, result) {
		  if (err) throw err;
		  dbo.collection("user").findOne({_id: new objectId(result.fabuzheID)},function(err,ee){
			if (err) throw err;
			console.log(ee)
			result.fabuzhe=ee;
			res.end(JSON.stringify(result))
			db.close();
		  })
	  });
	});
});
app.post('/moreshipin', function(req, res, next) {
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	    if (err) throw err;
	    var dbo = db.db("yundong");
	    dbo.collection("shipin").find({}).limit(10).toArray(function(err, result) { // 返回集合中所有数据
	        if (err) throw err;
			var arr=[];
			for(var i=0;i<result.length;i++){
				var obj={}
				obj._id=new objectId(result[i].fabuzheID)
				arr.push(obj)
			}
			dbo.collection("user").find({
				 $or: arr
			}).toArray(function(err,ee){
				if (err) throw err;
				for(var i=0;i<result.length;i++){
					for(var j=0;j<ee.length;j++){
						if(result[i].fabuzheID==ee[j]._id){
							result[i].username=ee[j].username;
							result[i].userpic=ee[j].userpic;
						}
					}
				}
				res.send(result)
				 db.close();
			})
	       
	    });
	});
});
app.get('/goods', function(req, res, next) {
	res.writeHead(200, {
		'Content-Type': 'text/html:charset=utf-8'
	})
	fs.readFile('./data/good.json', 'utf-8', function(err, data) {
		if(err) {
			throw err;
		}
		res.end(data);
	});
});
app.post('/goods', function(req, res, next) {
	var data = '';
	var dataObject = {};
	req.on('data', function(chunk) {
		data += chunk;
	});
	req.on('end', function() {
		data = decodeURI(data);
	});
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	    if (err) throw err;
	    var dbo = db.db("yundong");
	    dbo.collection("goods").find({name:{$regex:data}}).toArray(function(err, result) {
	        if (err) throw err;
			res.send(result);
	        db.close();
	    });
	});
});
app.get('/', function(req, res, next) {
	res.writeHead(200, {
		'Content-Type': 'text/html'
	})
	fs.readFile('./data/login.html', 'utf-8', function(err, data) {
		if(err) {
			throw err;
		}
		res.end(data);
	});
});
// 后台登录
app.post('/admin', function(req, res, next) {
	var data = '';
	var dataObject = {};
	req.on('data', function(chunk) {
		data += chunk;
	});
	req.on('end', function() {
		data = decodeURI(data);
		dataObject = querystring.parse(data);
	});
	MongoClient.connect(url, {
		useNewUrlParser: true
	}, function(err, db) {
		if(err) throw err;
		var dbo = db.db("yundong");
		var whereStr = {
			"name": dataObject.title,
			"password": dataObject.username
		}; // 查询条件
		console.log(whereStr)
		dbo.collection("admin").find(whereStr).toArray(function(err, result) {
			if(err) throw err;
			if(result.length == 0) {
				res.send('错误')
			} else {
				fs.readFile('./data/admin.html', 'utf-8', function(err, data) {
					if(err) {
						throw err;
					}
					res.end(data);
				});
			}
			db.close();
		});
	});
});

app.post('/login', function(req, res, next) {
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	    if (err) throw err;
	    var dbo = db.db("yundong");
		var whereStr = {"username":req.body.username,"password": req.body.password};  // 查询条件
	    dbo.collection("user").find(whereStr).toArray(function(err, result) {
	        if (err) throw err;
			res.send(result);
	        db.close();
	    });
	});
});
app.post('/zhuce', function(req, res, next) {
	MongoClient.connect(url, { useNewUrlParser: true }, function(err, db) {
	    if (err) throw err;
	    var dbo = db.db("yundong");
		var whereStr = {username:req.body.username,password: req.body.password,userpic:'',friend:0,fensi:0,dongtai:0,jinbi:0,paofuliang:[],qiandaotianshu:0,qixingliang:[],buxingliang:[]};  
		dbo.collection("user").insertOne(whereStr, function(err, result) {
		    if (err) throw err;
		    res.send(result.ops);
		    db.close();
		});
	});
});
app.get('/adminshipin', function(req, res, next) {
	console.log(req.query)
	MongoClient.connect(url, {
		useNewUrlParser: true
	}, function(err, db) {
		if(err) throw err;
		var dbo = db.db("yundong");
		var whereStr = {},
			dd = {};
		dbo.collection("shipin").find(whereStr).skip((req.query.jj-1)*req.query.limit).limit(req.query.limit-1+1).toArray(function(err, result) {
			if(err) throw err;
			dd.code = 0;
			dd.count=30;
			dd.data = result;
			res.send(dd);
			db.close();
		});
	});
});
app.post('/adminuser', function(req, res, next) {
	MongoClient.connect(url, {
		useNewUrlParser: true
	}, function(err, db) {
		if(err) throw err;
		var dbo = db.db("yundong");
		var whereStr = {},
			dd = {};
		dbo.collection("user").find(whereStr).toArray(function(err, result) {
			if(err) throw err;
			dd.code = 0,
			dd.data = result
			res.send(dd);
			db.close();
		});
	});
});
app.get('/adminshangpin', function(req, res, next) {
	MongoClient.connect(url, {
		useNewUrlParser: true
	}, function(err, db) {
		if(err) throw err;
		var dbo = db.db("yundong");
		var whereStr = {},
			dd = {};
		dbo.collection("goods").find(whereStr).skip((req.query.jj-1)*req.query.limit).limit(req.query.limit-1+1).toArray(function(err, result) {
			if(err) throw err;
			dd.code = 0,
			dd.count=77;
			dd.data = result
			res.send(dd);
			db.close();
		});
	});
});
app.post('/adminDelete', function(req, res, next) {
	var data = '';
	req.on('data', function(chunk) {
		data += chunk;
	});
	req.on('end', function() {
		data = decodeURI(data);
		dataObject = querystring.parse(data);
	});
	
	MongoClient.connect(url, {
		useNewUrlParser: true
	}, function(err, db) {
		if(err) throw err;
		var dbo = db.db("yundong");
		var _id = new objectId(dataObject._id);
		var biao=dataObject.biao;
		var whereStr = {
			_id: _id
		};
		console.log(data)
		dbo.collection(biao).deleteOne(whereStr, function(err, obj) {
			if(err) throw err;
			console.log("文档删除成功");
			db.close();
		});
	});
});
app.post('/adminEdit', function(req, res, next) {
	var data = '';
	var dataObject = {};
	req.on('data', function(chunk) {
		data += chunk;
	});
	req.on('end', function() {
		data = decodeURI(data);
	});
	MongoClient.connect(url, {
		useNewUrlParser: true
	}, function(err, db) {
		if(err) throw err;
		data = JSON.parse(data)
		var dbo = db.db("yundong");
		var _id = new objectId(data._id);
		var whereStr = {
			_id: _id
		};
		var updateStr = {
			$set: data.obj
		};
		dbo.collection(data.biao).updateOne(whereStr, updateStr, function(err, obj) {
			if(err) throw err;
			res.send('susss');
			console.log("文档删除成功");
			db.close();
		});
	});
});
app.post('/adminAdd', function(req, res, next) {
	var data = '';
	req.on('data', function(chunk) {
		data += chunk;
	});
	req.on('end', function() {
		data = decodeURI(data);
	});
	MongoClient.connect(url, {useNewUrlParser: true}, function(err, db) {
		if(err) throw err;
		var dbo = db.db("yundong");
		data = JSON.parse(data);
		dbo.collection(data.biao).insertOne(data.obj, function(err, result) {
			if(err) throw err;
			res.send('susss');
			console.log("文档插入成功");
			db.close();
		});
	});
});
app.listen(3000);
console.log("监听端口 3000");