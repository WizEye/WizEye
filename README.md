# Welcome to WizEye 0.0.1

See demo of a working prototype in action:
<iframe src="//player.vimeo.com/video/107752236" width="500" height="435" frameborder="0" webkitallowfullscreen mozallowfullscreen allowfullscreen></iframe> <p><a href="http://vimeo.com/107752236">WizEye</a> from <a href="http://vimeo.com/user10050288">Robert Sedov&scaron;ek</a> on <a href="https://vimeo.com">Vimeo</a>.</p>

## What is WizEye

WizEye allows continuous control over the visual parts of an application.
It checks if users CSS changes will break the current design in unexpected ways,
shows a user a page he has been working on before and after his changes.
It enables to look back, how things looked over a month or a year ago.

This tool is a tool that generates and manages visual diffs of web pages so
they can easily see even the subtlest effects on the code modifications.
Simple UI enables user to perform all necessary operations regarding web page diff check.

## Installation

### Service installation
You need to install Node.js, MongoDB and ImageMagick to run the service.

### NodeJS

1. From http://nodejs.org/download/ download node.js prebuilt installer for
your platform.
2. Install node.js (double click and follow the instructions)
3. After successful node.js install, check in terminal if commands ‘npm’ and
‘node’ works for you. Installation should add npm to system path for you, if not, add it yourself.

### MongoDb

1. Install mongo database for your platform. Follow OS specific install guide on: http://docs.mongodb.org/manual/installation/.
2. After install, type into terminal ‘mongod’ to run your mongo instance.
3. No additional work is required from your side here. Service will take care of
database setup itself.
4. Check WizEye/service/db.js and set the database connection string. In most
cases the default should be enough.

### Imagemagick
1. Type into your terminal: `brew install imagemagick` if using OS X.
If not, find the right command for your system on http://ask.xmodulo.com/install-imagemagick-linux.html.

### Bookmarklet
To install bookmarklet all you have to do is to configure the service ip.
You do this in the wizeye-configuration.html file.
Change the variable `serviceHost` to match the address of the service.

## Run the Service
1. Open your terminal. Go to WizEye/service folder, using cd command (cd ~/ <your path to project>/WizEye/service/)
2. In terminal, type `npm install`. This will install all node.js required modules.
3. Check WizEye/service/config.js for proper selenium url after its setup.
4. Run ‘nodeserver.js’ to run the server.
5. You should see server status in your terminal.
