const fs = require('fs');


function main() {
    const data = JSON.parse(
        fs.readFileSync('./data.json', {encoding: 'utf8'})
    );
    
    const stages = data.data.stages;

    fs.writeFileSync('./src/stages.json', JSON.stringify(stages));
}


if (require.main === module) {
    main();
}