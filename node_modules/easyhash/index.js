cHsh = require("crypto").createHash;

module.exports = function (name, uri){
  if(uri !== false){
    uri = true;
  }

  return function(str){
    var hsh = cHsh(name);
    hsh.update(str);
    str = hsh.digest('base64');
    if(uri){
      str = str.replace(/\//g, '-').replace(/\+/g, '_').replace(/\=+$/, '');
    }
    return str;
    
  };
};


module.exports.hex = function(name){
  return function(str){
    var hsh = cHsh('sha1');
    hsh.update(str);
    return hsh.digest('hex');
  };
};