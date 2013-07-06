#!/usr/bin/env node
/*
Automatically grade files for the presence of specified HTML tags/attributes.
Uses commander.js and cheerio. Teaches command line application development
and basic DOM parsing.

References:

 + cheerio
   - https://github.com/MatthewMueller/cheerio
   - http://encosia.com/cheerio-faster-windows-friendly-alternative-jsdom/
   - http://maxogden.com/scraping-with-node.html

 + commander.js
   - https://github.com/visionmedia/commander.js
   - http://tjholowaychuk.com/post/9103188408/commander-js-nodejs-command-line-interfaces-made-easy

 + JSON
   - http://en.wikipedia.org/wiki/JSON
   - https://developer.mozilla.org/en-US/docs/JSON
   - https://developer.mozilla.org/en-US/docs/JSON#JSON_in_Firefox_2
   
 + restler
   - https://github.com/danwrong/restler
*/

var fs = require('fs');
var program = require('commander');
var cheerio = require('cheerio');
var sys = require('util');
var rest = require('restler');
var Step = require('step');

var HTMLFILE_DEFAULT = "index.html";
var HTMLFILE_FROM_URL = "url.html";
var CHECKSFILE_DEFAULT = "checks.json";

var syncFlag = 0;

var assertFileExists = function(infile) {
    var instr = infile.toString();
    if(!fs.existsSync(instr)) {
        console.error("%s does not exist. Exiting.", instr);
        process.exit(1); // http://nodejs.org/api/process.html#process_process_exit_code
    }
    return instr;
};

var cheerioHtmlFile = function(htmlfile) {
    return cheerio.load(fs.readFileSync(htmlfile));
};

var loadChecks = function(checksfile) {
    return JSON.parse(fs.readFileSync(checksfile));
};

var printResult = function(checkJson)
{
    var outJson = JSON.stringify(checkJson, null, 4);
    console.log("Check result:\n%s", outJson);
};

var checkHtmlFile = function(htmlfile, checksfile) {
    debugger;
    $ = cheerioHtmlFile(htmlfile);
    var checks = loadChecks(checksfile).sort();
    var out = {};
    for(var ii in checks) {
        var present = $(checks[ii]).length > 0;
        out[checks[ii]] = present;
    }
    return out;
};

var checkUrl = function(url2check, checksfile) 
{
    Step (
        function getUrl()
        {      
            rest.get(url2check).on('complete', this);
        },
        function writeResultTmpFile(result)
        {
            if (result instanceof Error) 
            {
                console.error('URL check error: ' + result.message);
                process.exit(1);
            } 
            else 
            {
                fs.writeFile(HTMLFILE_FROM_URL, result, this);
            }
        },
        function processResult(err)
        {
            if (err) 
            {
                console.error( arguments.callee.name + " : error : " + err);
                throw err;
            }
                    
            console.log('File %s saved!', HTMLFILE_FROM_URL);
            
            var checkJson = checkHtmlFile(HTMLFILE_FROM_URL, checksfile);
            printResult(checkJson);
        },
        function removeTmpFile(err)
        {
            if (err) 
            {
                console.error( arguments.callee.name + " : error : " + err);
                throw err;
            }
            
            fs.unlink(HTMLFILE_FROM_URL, function(err) { 
                console.error('Failed to remove %s', HTMLFILE_FROM_URL); 
                });
        }
    );
};

var clone = function(fn) {
    // Workaround for commander.js issue.
    // http://stackoverflow.com/a/6772648
    return fn.bind({});
};

if(require.main == module) {
    program
        .option('-c, --checks <check_file>', 'Path to checks.json', clone(assertFileExists), CHECKSFILE_DEFAULT)
        .option('-f, --file [html_file]', 'Path to index.html', '')
        .option('-u, --url [url]', 'URL to check', '')
        .parse(process.argv);

    // typeof variable === 'undefined'
    if ( typeof program.file === 'undefined' && typeof program.url === 'undefined')
    {
        console.error("Either --url or --file parameter should be specified.");
        program.help();
        process.exit(1);
    }
    
    var checkJson;
    
    if ( program.url )
    {
        console.log("Checking URL: %s", program.url);
        checkUrl(program.url, program.checks);
    }
    else if ( program.file )
    {
        console.log("Checking file: %s", program.file);
        assertFileExists(program.file);
        checkJson = checkHtmlFile(program.file, program.checks);
        
        printResult(checkJson);
    }
    
    
} else {
    exports.checkHtmlFile = checkHtmlFile;
}
