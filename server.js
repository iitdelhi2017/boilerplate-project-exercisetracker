const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
var bodyParser=require('body-parser');
var mongoose=require('mongoose');


app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

//--------------------------------------------------------------------

mongoose.connect("mongodb+srv://user1:user1@cluster0.tcl4l.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
, { useNewUrlParser: true, useUnifiedTopology: true });

var personSchema=new mongoose.Schema({
  username: String,
  exercise:[{
    date:Number,
    dur:String,
    des:String
  }]
});

var Person=mongoose.model('Person',personSchema);

Person.remove({},function(err,data){
  if(err) console.error(err);
});

app.use(bodyParser.urlencoded({extended:false}));

const day=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const month=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

var add_user=function(req,res){
  var person=new Person({username:req.body.username});
  person.save(function(err,data){
      if(err) console.error(err);
      res.json({"username":data.username,"_id":data._id});
  });
};

var add_exercise=(req,res)=>{
  if(req.params._id==undefined)
  {
    res.send('not found');return;
  }
  else if(req.body.description==undefined){
    res.send('Path \`description\` is required');
    return;
  }
  else if(req.body.duration==undefined)
  {
    res.send('Path \`duration\` is required');
    return;
  };
  var info={date:req.body.date,dur:req.body.duration,des:req.body.description};
  if(info.date==undefined || info.date==''){
    info.date=(+new Date());
  }
  else{
    info.date=Date.parse(req.body.date.toString());
  };
  
  Person.findOne({"_id":req.params._id},function(err,person){
    
    if(err) console.error(err);
    if(person==null){
      var result="Cast to ObjectId failed for value \""+req.params._id+"\" at path \"_id\" for model \"Person\"";
      res.send(result);
      return;
    };
  
    person.exercise.push(info);
    person.save(function(err,data){
      if(err) console.error(err);
      var stamp=new Date(parseInt(info.date));
      var date_format=day[stamp.getDay()]+" "+month[stamp.getMonth()]+" ";var d=stamp.getDate();
      if(d<10)
        d="0"+(stamp.getDate()).toString();
      else d=d.toString();
      date_format+=d+" "+(stamp.getFullYear()).toString();
      var result={
        "_id":req.params._id,
        "username":data.username,
        "date":date_format,
        "duration":parseInt(info.dur),
        "description":info.des
      };
      res.json(result);
    });
  });
};

var user_log=function(req,res){
      console.log(req.query);

  Person.findOne({_id:req.params._id},function(err,data){
    if(err) console.error(err);
    var logs=[];
    if(data.exercise.length>0)
    for(var i=data.exercise.length-1;i>=0;i--){
      if(req.query.limit!=undefined && logs.length>=parseInt(req.query.limit))
        break;
      if(req.query.from!=undefined && req.query.to!=undefined && (data.exercise[i].date<Date.parse(req.query.from) || data.exercise[i].date>Date.parse(req.query.to)))
        continue;
      var stamp=new Date(parseInt(data.exercise[i].date));
      var date_format=day[stamp.getDay()]+" "+month[stamp.getMonth()]+" ";
      var d=(stamp.getDate()).toString();
      if(d.length==1)d="0"+d;
      date_format+=d+" "+(stamp.getFullYear()).toString();
      logs.push({"description":data.exercise[i].des,"duration":data.exercise[i].dur,"date":date_format})
    };

    var result={
      "_id":data._id,
      "username":data.username,
      "count":logs.length,
      "log":logs
    };
    console.log(result);
    res.json(result);
  });
};

var all_users=function(req,res){
  var query=Person.find({});
  query.select('_id username __v');
  query.exec(function(err,data){
    if(err) console.error(err);
    res.json(data);
  });
};

app.post('/api/users',add_user);
app.post('/api/users/:_id/exercises',add_exercise);
app.get('/api/users/:_id/logs',user_log);
app.get('/api/users',all_users);
//-------------------------------------------------------------------------



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
