
seleniumJAR="selenium-server-standalone-2.43.1.jar"
hubIP="http://localhost:5000/grid/register"
driver="/absolute/path/to/driver"
browserName="browserName"
port="5004"

java -jar ${seleniumJAR} -port ${port} -role node -hub ${hubIP} -timeout 0 -browser "browserName=${browserName},maxInstances=10" &
