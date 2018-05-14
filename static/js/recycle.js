function Recycle(){
	let path
	let all
	let contentRecycle
	let listBody
	let selectorButton
	let resetButton
	let open = false

	function parse(){
		path = decodeURIComponent(window.location.hash).split('recycle=').pop()
		if(!path||path=='#recycle'||path=='/'){
			path = '/'
			selectorButton.innerHTML = '任何文件夹'
			resetButton.classList.add('hide')
		}
		else{
			selectorButton.innerHTML = path.split('/').pop()
			resetButton.classList.remove('hide')
		}
	}

	function init(){
		document.title = '已删除文件 - Dropbox'
		contentRecycle = createElement('div','content recycle')
		let titleBar = createElement('div','title-bar')
		let containerTitle = createElement('div','container-title')
		containerTitle.innerHTML = '已删除文件'
		titleBar.appendChild(containerTitle)
		contentRecycle.appendChild(titleBar)
		let documentContainer = createElement('div','document-container')
		let documentList = createElement('div','document-list')
		let listHeader = createElement('div','list-header')
		let headerContent = createElement('div','header-content')
		let columnOne = createElement('div','column')
		let nameOne = createElement('div','')
		nameOne.innerHTML = '名称'
		columnOne.appendChild(nameOne)
		headerContent.appendChild(columnOne)
		let columnTwo = createElement('div','column')
		let nameTwo = createElement('div','')
		nameTwo.innerHTML = '已删除'
		columnTwo.appendChild(nameTwo)
		headerContent.appendChild(columnTwo)
		listHeader.appendChild(headerContent)
		documentList.appendChild(listHeader)
		listBody = createElement('div','list-body')
		documentList.appendChild(listBody)
		operationPanel = createElement('div','operation-panel')
		let selectorTip = createElement('div','selector-tip')
		selectorTip.innerHTML = '在文件夹中'
		selectorButton = createElement('button','selector path')
		selectorButton.onclick = function(){
			select()
		}
		resetButton = createElement('div','reset')
		resetButton.innerHTML = '重置过滤器'
		resetButton.onclick = function(){
			window.location.hash = 'recycle'
		}
		operationPanel.appendChild(selectorTip)
		operationPanel.appendChild(selectorButton)
		operationPanel.appendChild(resetButton)
		documentContainer.appendChild(documentList)
		documentContainer.appendChild(operationPanel)
		contentRecycle.appendChild(documentContainer)
		document.body.appendChild(contentRecycle)
	}

	function buildLine(item){
		let documentItem = createElement('div','document-item')
		let itemContent = createElement('div','item-content')
		let columnOne = createElement('div','column')
		let mediaIcon = createElement('div','media-icon')
		mediaIcon.innerHTML = iconDetect(item.type)
		let itemInformation = createElement('div','item-information')
		let itemName = createElement('div','item-name')
		itemName.innerHTML = item.name
		let itemPath = createElement('div','item-path')
		itemPath.innerHTML = item.directory.split('/').filter(function(item){return item}).join('<div class="split"></div>')
		itemInformation.appendChild(itemName)
		itemInformation.appendChild(itemPath)
		columnOne.appendChild(mediaIcon)
		columnOne.appendChild(itemInformation)
		let columnTwo = createElement('div','column')
		let modifyTime = createElement('div','modify-time')
		modifyTime.innerHTML = timeReadable(item.modify)
		columnTwo.appendChild(modifyTime)
		itemContent.appendChild(columnOne)
		itemContent.appendChild(columnTwo)
		documentItem.appendChild(itemContent)
		itemContent.onclick = function(){
			recover(item)
		}
		return documentItem
	}

	function list(){
		let fragment = document.createDocumentFragment()
		all.forEach(function(item){
			let line = buildLine(item)
			fragment.appendChild(line)
		})
		listBody.innerHTML = ''
		listBody.appendChild(fragment)
	}

	function load(){
		if(!open){
			init()
			open = true
		}
		parse()
		request('GET',`${apiHost}/recycle?path=${path}`)
		.then(function(jsonBack){
			if(jsonBack['code']==200){
				all = jsonBack['data']
				list()
			}
			else{
				notify(errorReadable(jsonBack['message']),'error')
			}
		})
	}
	this.load = load

	function opened(){
		if(open)
			return true
		else
			return false
	}
	this.opened = opened

	function close(){
		contentRecycle.parentNode.removeChild(contentRecycle)
		open = false
	}
	this.close = close

	function select(){
		let selectedPath
		request('GET',`${apiHost}/tree`)
		.then(function(jsonBack){
			if(jsonBack['code']==200){
				let selector = createElement('div','selector')
				let tree = jsonBack['data']
				tree['name'] = 'Dropbox'
				informWindow = new InformWindow('文件夹过滤选择器',selector,'选择','取消',['no-close','center'])
				informWindow.defaultButton.disabled = true
				informWindow.defaultButton.onclick = function(){
					confirm()
					informWindow.quit()
				}
				informWindow.optionalButton.onclick = function(){
					informWindow.quit()
				}
				buildTree(selector,tree,0)
			}
		})

		function buildTree(fragment,tag,depth){
			let line = createElement('div','line')
			for(let i=0;i<depth;i++){
				let fill = createElement('div','fill')
				line.appendChild(fill)
			}
			let mediaIcon = createElement('div','media-icon')
			mediaIcon.innerHTML = iconDetect('directory').replace('width="40" height="40"','width="20" height="20"')
			let itemName = createElement('div','item-name')
			itemName.innerHTML = tag.name
			line.appendChild(mediaIcon)
			line.appendChild(itemName)
			line.onclick = function(){
				Array.from(this.parentNode.children).forEach(function(item){item.classList.remove('focus')})
				this.classList.add('focus')
				informWindow.defaultButton.disabled = false
				selectedPath = tag.path
			}
			line.ondblclick = function(){
				confirm()
				informWindow.quit()
			}
			fragment.appendChild(line)
			tag.children.forEach(function(item){
				buildTree(fragment,item,depth+1)
			})
		}

		function confirm(){
			window.location.hash = `recycle=${selectedPath}`
		}
	}


	function recover(item){

		let informWindow = {}
		let titleContent = ''
		let bodyFragment = ''
		let defaultContent = '恢复'
		let optionalContent = '取消'
		let directoryName = (item['directory'] == '/') ? 'Dropbox' : item['directory'].slice(1)
		let innerItems = []

		if(item['type'] != 'directory'){
			titleContent = item['name']
			bodyFragment = singleStatus(item,directoryName)
			informWindow = new InformWindow(titleContent,bodyFragment,defaultContent,optionalContent)
			attach(informWindow)
		}
		else{
			titleContent = item['name']
			headerText = `您在 ${timeReadable(item['modify'])} 删除`

			request('POST',`${apiHost}/status`,`dir=${item['directory']}&name=${item['name']}`)
			.then(function(jsonBack){
				if(jsonBack['code'] == 200){
					innerItems = jsonBack['data']
					bodyFragment = multipleStatus(innerItems,headerText)
					bodyFragment.classList.add('special')
					defaultContent = (innerItems.length > 0) ? '恢复所有文件' : '恢复'
					informWindow = new InformWindow(titleContent,bodyFragment,defaultContent,optionalContent)
					attach(informWindow)
					
				}
			})
		}

		function attach(informWindow){
			let extraButton = createElement('button','extra')
			extraButton.innerHTML = '永久删除'
			extraButton.style.height = '32px'
			extraButton.style.paddingRight = '8px'
			extraButton.style.color = '#D62C0B'
			extraButton.style.fontSize = '14px'
			extraButton.onclick  = function(){
				informWindow.quit()
				smashAlert()
			}
			informWindow.operate.insertBefore(extraButton,informWindow.operate.firstChild)
			informWindow.defaultButton.onclick = function(){
				informWindow.quit()
				confirm('recover')
			}
		}

		function smashAlert(){
			let smashTitle = (innerItems.length == 0) ? `是否永久删除 1 个项目？` : `是否永久删除 ${innerItems.length} 个项目？`
			let message = createElement('div','message')
			message.innerHTML = `“<b>${item['name']}</b>”将永远消失，且您将无法恢复。`
			let confirmWindow = new InformWindow(smashTitle,message,'永久删除','取消',['center','no-frame'])
			let moreHref = createElement('a','link')
			moreHref.innerHTML = '了解更多'
			moreHref.href = 'https://www.dropbox.com/help/desktop-web/delete-files#permanent_delete'
			moreHref.target = '_blank'
			confirmWindow.operate.insertBefore(moreHref,confirmWindow.operate.firstChild)
			confirmWindow.defaultButton.onclick = function(){
				confirmWindow.quit()
				confirm('smash')
			}
		}
		
		function confirm(action){
			request('POST',`${apiHost}/${action}`,`dir=${item['directory']}&name=${item['name']}`)
			.then(function(jsonBack){
				if(jsonBack['code'] == 200){
					all.splice(all.indexOf(item),1)
					list()
					notify(((action == 'recover') ? '已成功恢复文件。':'已完成永久删除文件。'),'success')
					if(item.directory == container.getCwd()){
						container.load()
					}
				}
				else{
					notify(errorReadable(jsonBack['message']),'error')
				}
			})
		}

	}
}