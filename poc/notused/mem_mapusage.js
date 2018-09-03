console.log("Mem Usage")
var map = {};
for (var i = 0; i < 100000000; i++) {
    map[i + "1354d75818ea"] = true;
    if ((i % 100001) == 1) {
    	console.log("counter"+i);
    	const used = process.memoryUsage().heapUsed / 1024 / 1024;
        console.log(`The script uses approximately ${Math.round(used * 100) / 100} MB`);
        console.log("Ended");
    }
}