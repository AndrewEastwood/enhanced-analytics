rm -rf ./dist
npm run build
npm --no-git-tag-version version patch
cp package.json ./dist/package.json
cp .npmrc ./dist/.npmrc
# cp ./src/types.ts ./dist/types.ts
# cp .npmrc ./dist/.npmrc
cd ./dist
npm publish
