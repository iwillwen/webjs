# eeasyhash makes node.js crypto easy!

I was sick of reinitializing node.js's hash function to just hash a single string that was already buffered in memory.  

So, I created this little library (with tests) that makes it very easy to take the hash of a string (or Buffer);

## Example:

A re-usable function is returned:

      var md5 = easyhash.hex('md5');
      md5("Aaron Blohowiak");
      //"c4cba515c08b8d502826a56ccb63d2ec8e5dd1e3"
      
      md5("ezhash");
      //"6e4601b041ce96363e68ef99ca7ad7a77ff000da"


## Old Way to get a b64-uri encoded hash of two strings:

      createHsh = require("crypto").createHash;
      
      results = {};

      var hsh = createHsh("sha1");
      results["Aaron Blohowiak"] = hsh.update("Aaron Blohowiak").digest("base64").replace(/\//g, '-').replace(/\+/g, '_').replace(/=+$/, '');
      
      var hsh2 = createHsh("sha1"); // cannot re-use Crypto hashes!
      results["this stinks"] = hsh.update("this stinks").digest("base64").replace(/\//g, '-').replace(/\+/g, '_').replace(/=+$/, '');
      

## New Way to get a b64-uri encoded sha1 of two strings:

      var sha1 = easyhash('sha1');
      results = {};
      
      results["Aaron Blohowiak"] = sha1("Aaron Blohowiak");
      results["this rocks"] = sha1("this rocks");

## WARNING!

The function calls create a new Crypto hash for each successive call and then get the current digest.

### WHEN YOU WANT THIS:

When you are hashing independent strings.

### WHEN YOU DO NOT WANT THIS:

When you are hashing a stream, like if you were streaming a file from disk.

*********

## API

#### `require("easyhash")` - `function(name, uri=true)`:

Takes a name, `['md5', 'sha1'...]` and returns a function, `function(str)` that takes a string and returns its hash in base64-uri encoding  -- `tr('/+', '-_').replace('=','')`. Set `uri` to `false` if you want standard base64 encoding.

#### `require("easyhash").hex` - `function(name)`:

As above, but returning a function that takes a string and returns its hash in hexadecimal encoding.

