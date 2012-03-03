module.exports = function (path) {
    var self = this;
    return function (req, res, next) {
        res
            .on('send', function () {
                //still working..
            });
    };
};