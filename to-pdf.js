var fs = require('fs'),
    gm = require('gm'),
    pdfDocument = require('pdfkit'),
    growl = require('growl');

var pdf = new pdfDocument(),
    walkPath = './',
    pdfName = 'images.pdf';

var walk = function (dir, done) {
    fs.readdir(dir, function (error, list) {
        if (error) {
            return done(error);
        }

        var i = 0;

        (function next () {
            var filename = list[i++];

            if (!filename) {
                return done(null);
            }
            
            var file = dir + '/' + filename;
            
            fs.stat(file, function (error, stat) {
        
                if (stat && stat.isDirectory()) {
                    walk(file, function (error) {
                        next();
                    });
                } else {
                    // do stuff to file here

                    if ((/\.(jpg|jpeg|png)$/i).test(file)) {
                        console.log(file);

                        if (!fs.existsSync(dir + '/resized')) {
                            fs.mkdirSync(dir + '/resized');
                        }

                        // resize and save to resized folder
                        gm(file)
                        .resize(400)
                        .noProfile()
                        .rotate('white', 90)
                        .write(dir + '/resized/' + filename, function (error) {
                            if (!error) {
                                // add to pdf
                                pdf.image(dir + '/resized/' + filename);
                                // add next page to pdf
                                pdf.addPage();
                            } else {
                                console.log(error);
                            }

                            next();
                        });
                    } else {
                        next();
                    }
                }
            });
        })();
    });
};

// optional command line params
//      source for walk path
process.argv.forEach(function (val, index, array) {
    if (val.indexOf('source') !== -1) {
        walkPath = val.split('=')[1];
    } else if (val.indexOf('pdfname') !== -1) {
        pdfName = val.split('=')[1];
        if (pdfName.indexOf('.pdf') === -1) {
            pdfName = pdfName + '.pdf';
        }
    } else if (val.indexOf('title') !== -1) {
        pdf.info['Title']  = val.split('=')[1];
    } else if (val.indexOf('author') !== -1) {
        pdf.info['Author'] = val.split('=')[1];
    }
});

console.log('-------------------------------------------------------------');
console.log('processing...');
console.log('-------------------------------------------------------------');

walk(walkPath, function (error) {
    if (error) {
        console.log(error);
    } else {
        console.log('-------------------------------------------------------------');
        console.log('finished.');
        console.log('-------------------------------------------------------------');

        pdf.write(walkPath + '/' + pdfName);

        growl('Images processed and '+ pdfName + ' created!');
    }
});