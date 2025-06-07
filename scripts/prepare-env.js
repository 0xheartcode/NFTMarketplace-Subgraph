require('dotenv').config();
const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

// Load template
const template = yaml.load(fs.readFileSync(path.join(__dirname, '../subgraph.template.yaml'), 'utf8'));

// Replace placeholders in template
template.dataSources.forEach(dataSource => {
  dataSource.network = process.env.NETWORK;
  if (dataSource.name === 'NFT721Factory') {
    dataSource.source.address = process.env.NFT721_FACTORY_ADDRESS;
    dataSource.source.startBlock = parseInt(process.env.START_BLOCK);
  } else if (dataSource.name === 'NFT1155Factory') {
    dataSource.source.address = process.env.NFT1155_FACTORY_ADDRESS;
    dataSource.source.startBlock = parseInt(process.env.START_BLOCK);
  } else if (dataSource.name === 'NFT6909Factory') {
    dataSource.source.address = process.env.NFT6909_FACTORY_ADDRESS;
    dataSource.source.startBlock = parseInt(process.env.START_BLOCK);
  } else if (dataSource.name === 'NFTMarketplace') {
    dataSource.source.address = process.env.NFT_MARKETPLACE_ADDRESS;
    dataSource.source.startBlock = parseInt(process.env.START_BLOCK);
  }
});

if (template.templates) {
  template.templates.forEach(templateDs => {
    templateDs.network = process.env.NETWORK;
  });
}
// Write generated subgraph.yaml
fs.writeFileSync(
  path.join(__dirname, '../subgraph.yaml'),
  yaml.dump(template),
  'utf8'
);
