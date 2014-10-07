#!/bin/bash

#this variables need to be customized
hubIP="http://localhost:5000/grid/register"
seleniumJAR="selenium-server-standalone-2.43.1.jar"
chromeDriver="/Users/gregorgololicic/Dev/celtra/seleniumServer/drivers/chromedriver"

# 3>&log redirect error to log file
# 2>&log redirect output to log file

#hub
java -jar ${seleniumJAR} -role hub -port 5000 &
 
#firefox node
java -jar ${seleniumJAR} -port 5001 -role node -hub ${hubIP} -timeout 0 -browser "browserName=firefox,maxInstances=10" &
#chrome node version 35
java -jar ${seleniumJAR} -port 5002 -role node -hub ${hubIP} -timeout 0 -browser "browserName=chrome,maxInstances=10" -Dwebdriver.chrome.driver=${chromeDriver} &
