.PHONY: install build watch clean package vsix-install build-local dev

NODE_BIN := node_modules/.bin
VSCODE := $(or $(shell which cursor 2>/dev/null),$(shell which code 2>/dev/null),code)
VSIX := code-jump-tracker-$(shell node -p "require('./package.json').version").vsix

install: node_modules

node_modules: package.json
	npm install
	@touch $@

build: node_modules
	node esbuild.js

watch: node_modules
	node esbuild.js --watch

clean:
	@echo "Cleaning dist/ and *.vsix..."
	@[ -d dist ] && node -e "require('fs').rmSync('dist',{recursive:true})" || true
	@ls *.vsix >/dev/null 2>&1 && node -e "require('fs').readdirSync('.').filter(f=>f.endsWith('.vsix')).forEach(f=>require('fs').unlinkSync(f))" || true

package: build
	npx @vscode/vsce package --no-dependencies

vsix-install:
	$(VSCODE) --install-extension $(VSIX)

local-install: install build package vsix-install
	@echo "Installed $(VSIX). Reload window to activate."

dev: install build
	@echo "Ready. Press F5 in VS Code to launch Extension Development Host."
