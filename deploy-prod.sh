npm run build
rsync -azv -C --delete --delete-after ./dist/* cruz.shia@54.255.134.42:/home/cruz.shia/langCampaign
rsync -azv -C --delete --delete-after ./dist/* cruz.shia@13.250.99.49:/home/cruz.shia/langCampaign