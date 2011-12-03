var ezhsh = require("./index");

exports["test the sha1 of my name"] = function(test, assert){
  
  assert.equal(ezhsh('sha1')("Aaron Blohowiak"), "xMulFcCLjVAoJqVsy2PS7I5d0eM");  
  test.finish();
};

exports["test the convienence"] = function(test, assert){
  var sha1uri  = ezhsh('sha1');
  
  assert.equal(sha1uri("Aaron Blohowiak"), "xMulFcCLjVAoJqVsy2PS7I5d0eM");
  assert.equal(sha1uri("ezhash"), "bkYBsEHOljY_aO_ZynrXp3-wANo");
  test.finish();
};

exports["test md5"] = function(test, assert){
  
  var md5  = ezhsh.hex('md5');
  
  assert.equal(md5("Aaron Blohowiak"), "c4cba515c08b8d502826a56ccb63d2ec8e5dd1e3");
  assert.equal(md5("ezhash"), "6e4601b041ce96363e68ef99ca7ad7a77ff000da");
  test.finish();
};


exports["test md5"] = function(test, assert){
  
  var md5  = ezhsh.hex('md5');
  
  assert.equal(md5("Aaron Blohowiak"), "c4cba515c08b8d502826a56ccb63d2ec8e5dd1e3");
  assert.equal(md5("ezhash"), "6e4601b041ce96363e68ef99ca7ad7a77ff000da");
  test.finish();
};

exports["test buffer and strings"] = function(test, assert){
  
   var b = new Buffer("Aaron Blohowiak");
   var s = "Aaron Blohowiak";
   
   var md5  = ezhsh.hex('md5');
   
   assert.equal(md5(b), md5(s));
   test.finish(); 
};