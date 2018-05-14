function Container(){

	const directoryPath = createElement('div','directory-path')
	const documentList = createElement('div','document-list')
	const listHeader = createElement('div','list-header')
	const listBody = createElement('div','list-body')
	const headerButton = ['','','',''].map(function(text){
		let button = createElement('button','')
		button.innerHTML = text
		return button
	})
	const operationPanel = createElement('div','operation-panel')
	const selectCounter = createElement('div','select-count')
	const defaultOperation = createElement('button','default')

	let workingDirectory
	let viewType = "list"
	let all = []
	let care = false
	let column = ["item-name","modify-time","item-owner"]
	let reverse = false
	let order = 0
	let deleted = false

	function syncPreference(){
		let columnStroage = localStorage.getItem('column')
		if(columnStroage){
			columnStroage = columnStroage.split(',')
			column = (columnStroage.length == 3) ? columnStroage : column
		}
		let orderStroage = parseInt(localStorage.getItem('order'))
		if(orderStroage > -2 && orderStroage < 3)
			order = orderStroage
		deleted = (localStorage.getItem('deleted') == 'true') ? true : deleted
		reverse = (localStorage.getItem('reverse') == 'true') ? true : reverse
	}

	function storePreference(){
		localStorage.setItem('column',column)
		localStorage.setItem('deleted',deleted)
		localStorage.setItem('reverse',reverse)
		localStorage.setItem('order',order)
	}
	this.storePreference = storePreference

	function init(){
		syncPreference()
		let content = createElement('div','content')
		let titleBar = createElement('div','title-bar')
		titleBar.appendChild(directoryPath)
		content.appendChild(titleBar)
		let documentContainer = createElement('div','document-container')
		let selectAllButton = createElement('button','select')
		selectAllButton.onclick = function(){
			select()
		}
		let headerContent = createElement('div','header-content')
		let headerColumn = [0,1,2,3].map(function(){return createElement('div','column')})

		headerButton.slice(0,3).forEach(function(button,index){
			button.innerHTML = {'item-name':'名称','modify-time':'最后修改时间','item-owner':'成员','item-type':'类型','item-extension':'扩展名','item-size':'大小'}[column[index]]

			button.onclick = function(){
				let menu = [
					{
						'text': '排序',
						'className': 'tip'
					},
					{
						'text': '升序',
						'className': 'item' + ((order == index && reverse == false) ? ' active' : ''),
						'click': function(){
							order = index
							reverse = false
							list()
						}
					},
					{
						'text': '降序',
						'className': 'item' + ((order == index && reverse == true) ? ' active' : ''),
						'click': function(){
							order = index
							reverse = true
							list()
						}
					}
				]

				if(index == 1 || index == 2){
					menu.push(
						{
							'text': '',
							'className': 'rule'
						},
						{
							'text': '显示',
							'className': 'tip'
						},
						{
							'text': '最后修改时间',
							'className': 'item' + ((column[index] != 'modify-time') ? (column.indexOf('modify-time') != -1) ? ' disable' : '' : ' active'),
							'click': function(){
								button.innerHTML = this.innerHTML
								column[index] = 'modify-time'
								order = -1
								list()
							}
						},
						{
							'text': '成员',
							'className': 'item' + ((column[index] != 'item-owner') ? (column.indexOf('item-owner') != -1) ? ' disable' : '' : ' active'),
							'click': function(){
								button.innerHTML = this.innerHTML
								column[index] = 'item-owner'
								order = -1
								list()
							}
						},
						{
							'text': '类型',
							'className': 'item' + ((column[index] != 'item-type') ? (column.indexOf('item-type') != -1) ? ' disable' : '' : ' active'),
							'click': function(){
								button.innerHTML = this.innerHTML
								column[index] = 'item-type'
								order = -1
								list()
							}
						},
						{
							'text': '扩展名',
							'className': 'item' + ((column[index] != 'item-extension') ? (column.indexOf('item-extension') != -1) ? ' disable' : '' : ' active'),
							'click': function(){
								button.innerHTML = this.innerHTML
								column[index] = 'item-extension'
								order = -1
								list()
							}
						},
						{
							'text': '大小',
							'className': 'item' + ((column[index] != 'item-size') ? (column.indexOf('item-size') != -1) ? ' disable' : '' : ' active'),
							'click': function(){
								button.innerHTML = this.innerHTML
								column[index] = 'item-size'
								order = -1
								list()
							}
						}
					)
				}

				let popup = buildMenu(menu)
				popup.classList.add(["one","two","three"][index])
				listHeader.appendChild(popup)
				popup.focus()
			}
		})

		headerColumn.forEach(function(column,index){
			column.appendChild(headerButton[index])
			headerContent.appendChild(column)
		})

		listHeader.appendChild(selectAllButton)
		listHeader.appendChild(headerContent)
		documentList.appendChild(listHeader)
		documentList.appendChild(listBody)
		documentContainer.appendChild(documentList)
		operationPanel.appendChild(selectCounter)
		operationPanel.appendChild(defaultOperation)
		let permission = createElement('div','permission')
		permission.innerHTML = '只有您能访问'
		operationPanel.appendChild(permission)
		let option = createElement('div','option')
		let uploadButton = createElement('button','upload')
		let mkdirButton = createElement('button','mkdir')
		let viewButton = createElement('button','show')
		let downloadButton = createElement('button','download')
		let historyButton = createElement('button','history')
		let renameButton = createElement('button','rename')
		let moveButton = createElement('button','move')
		let copyButton = createElement('button','copy')
		let deleteButton = createElement('button','delete')
		let smashButton = createElement('button','smash')

		uploadButton.onclick = function(){
			uploader.createTask()
		}
		mkdirButton.onclick = function(){
			mkdir()
		}
		viewButton.onclick = function(){
			deleted = !deleted
			this.className = (deleted) ? 'hide' : 'show'
			list()
		}
		downloadButton.onclick = function(){
			download(getSelected())
		}
		historyButton.onclick = function(){
			let filePath = (workingDirectory == '/') ? `/${getSelected()[0].name}` : `${workingDirectory}/${getSelected()[0].name}`
			window.location.hash = `history=${filePath}`
		}
		renameButton.onclick = function(){
			rename(getSelected()[0])
		}
		moveButton.onclick = function(){
			movecopy(getSelected(),'move')
		}
		copyButton.onclick = function(){
			movecopy(getSelected(),'copy')
		}
		deleteButton.onclick = function(){
			remove(getSelected())
		}
		smashButton.onclick = function(){
			smash(getSelected())
		}

		let buttonArray = new Array(uploadButton,mkdirButton,viewButton,downloadButton,historyButton,renameButton,moveButton,copyButton,deleteButton,smashButton)
		buttonArray.forEach(
		function(button){
			let item = createElement('div','item')
			item.appendChild(button)
			option.appendChild(item)
		})
		operationPanel.appendChild(option)
		
		documentContainer.appendChild(operationPanel)
		content.appendChild(documentContainer)
		document.body.appendChild(content)
	}
	init()


	function getSelected(){
		return all.filter(function(item){return item.selected == true})
	}

	function getDirectoryName(){
		return directoryPath.getElementsByClassName('directory-level working')[0].innerHTML
	}

	function getCwd(){
		return workingDirectory
	}
	this.getCwd = getCwd

	function locate(){
		if(window.location.hash[1] != '/') return
		workingDirectory = decodeURIComponent(window.location.hash).slice(1)
		directoryLevel = workingDirectory.split("/").filter(function(item){return item})
		directoryLevel.unshift('Dropbox')

		let fragment = document.createDocumentFragment()
		for(let i=0;i<directoryLevel.length;i++){
			let levelItem = createElement('a','directory-level')
			levelItem.innerHTML = directoryLevel[i]
			fragment.appendChild(levelItem)
			if(i == directoryLevel.length - 1){
				levelItem.classList.add("working")
				document.title = (i != 0) ? `${directoryLevel[i]} - Dropbox` : '文件 - Dropbox'
			}
			else{
				levelItem.href = '#/' + directoryLevel.slice(1,i+1).join('/')
				let split = createElement('a','split')
				fragment.appendChild(split)
			}
		}
		directoryPath.innerHTML = ''
		directoryPath.appendChild(fragment)
	}

	function sort(){
		headerButton.slice(0,3).forEach(function(element,index) {
			if(index == order)
				element.className = (reverse) ? 'reverse' :'forward'
			else
				element.className = ''
		})
		if(order == -1){
			return
		}
		let directories = all.filter(function(item){
			if(item.type == "directory")
				return item
		})
		let files = all.filter(function(item){
			if(item.type != "directory")
				return item
		})
		if(column[order] == "item-name"){
			directories.sort(sortBy('name',reverse))
			files.sort(sortBy('name',reverse))
			if(reverse)
				all = files.concat(directories)
			else
				all = directories.concat(files)
		}
		else if(column[order] == "modify-time"){
			files.sort(sortBy('modify',reverse))
			all = files.concat(directories)
		}
		else if(column[order] == "item-type"){
			files.sort(sortBy('type',reverse))
			directories.sort(sortBy('type',reverse))
			all = files.concat(directories)
		}
		else if(column[order] == "item-extension"){
			files.sort(sortBy('extension',reverse))
			all = files.concat(directories)
		}
		else if(column[order] == "item-size"){
			files.sort(sortBy('size',!reverse))
			all = files.concat(directories)
		}
	}

	function load(){
		locate()
		order = (order == -1) ? 0 : order
		request('GET',`${apiHost}/list?dir=${workingDirectory}`)
		.then(function(jsonBack){
			all = jsonBack['data']
			care = (jsonBack['message'] == 'care') ? true : false
			list()
			syncOperationPanel()
			documentList.classList.remove('select','all')
		})
	}
	this.load = load

	function list(){
		sort()
		refresh()
	}
	this.list = list

	function add(item){
		all.push(item)
		list()
		select(item)
	}
	this.add = add

	function getVisible(){
		return all.filter(function(item){if (item.status == 1 || deleted == true) return item})
	}

	function refresh(){
		let fragment = document.createDocumentFragment()
		getVisible().forEach(function(item){
			fragment.appendChild(buildLine(item))
		})
		listBody.innerHTML = ''
		listBody.appendChild(fragment)
	}

	function format(item,type){
		if(type == "icon"){
			if(item.type.indexOf('svg') != -1){
				return `<img src="${apiHost}/source/${item.name}?source=${item.source}">`
			}
			if(item.type.indexOf('image') != -1)
				return `<img src="${apiHost}/thumbnail/${item.name}?source=${item.source}">`
			else
				return iconDetect(item.type)
		}
		if(type == "modify-time"){
			if(item.type == 'directory')
				return '--'
			else
				return timeReadable(item.modify)
		}
		else if(type == "item-owner"){
			return (item.owner == "self") ? "只有您" : item.owner
		}
		else if(type == "item-type"){
			return mimeReadable(item.type,item.status)
		}
		else if(type == "item-extension"){
			return item.extension
		}
		else if(type == "item-size"){
			return sizeReadable(item.size)
		}
	}

	function buildLine(item){

		let documentItem = createElement('div','document-item')
		if(item.selected == true){documentItem.classList.add('selected')}

		let selectButton = createElement('button','select')
		let itemContent = createElement('div','item-content')

		documentItem.onclick = function(event){
			event.stopPropagation()
			selectButton.click()
		}

		selectButton.onclick = function(event){
			event.stopPropagation()
			select(item)
		}
		
		let baseColumn = createElement('div','column')
		let mediaIcon = createElement('div','media-icon')
		mediaIcon.innerHTML = format(item,'icon')
		if(item.status == 0)
			mediaIcon.classList.add('deleted')

		let itemName = createElement('div','item-name')
		itemName.innerHTML = item.name

		baseColumn.appendChild(mediaIcon)
		baseColumn.appendChild(itemName)

		let flexColumnOne = createElement('div','column')
		let flexItemOne = createElement('div',column[1])
		flexItemOne.innerHTML = format(item,column[1])

		flexColumnOne.appendChild(flexItemOne)

		let flexColumnTwo = createElement('div','column')
		let flexItemTwo = createElement('div',column[2])
		flexItemTwo.innerHTML = format(item,column[2])

		flexColumnTwo.appendChild(flexItemTwo)

		let actionColumn = createElement('div','column')
		let shareButton = createElement('button','share')
		let flexButton = createElement('button','flex')
		
		if(item.status == 1)
			actionColumn.appendChild(shareButton)
		actionColumn.appendChild(flexButton)

		let filePath = (workingDirectory == '/') ? `/${item.name}` : `${workingDirectory}/${item.name}`

		function defaultAction(){
			if(item.type == 'directory')
				window.location.hash = filePath
			else if(item.status == 0)
				recover([item])
			else
				window.location.hash = `preview=${filePath}`
		}

		itemContent.onclick = function(event){
			event.stopPropagation()
			if(documentList.classList.contains('select') == true)
				selectButton.click()
			else
				defaultAction()
		}

		shareButton.onclick = function(event){
			event.stopPropagation()
			console.log('???')
		}

		flexButton.onclick = function(event){
			event.stopPropagation()
			if(documentList.classList.contains('select') == true){
				defaultAction()
				return
			}
			let menu
			if(item.status == 0){
				menu = [
					{
						'text':'恢复',
						'click': function(){
							recover([item])
						}
					},
					{
						'text':'永久删除',
						'click': function(){
							smash([item])
						}
					}
				]
			}

			else if(item.status == 1){
				menu = [
					{
						'text':'共享',
						'click': function(){
							shareButton.click()
						}
					},
					{
						'text':'下载',
						'click': function(){
							download([item])
						}
					},
					{
						'text':'版本历史记录',
						'click': function(){
							window.location.hash = `history=${filePath}`
						}
					},
					{
						'text':'重命名',
						'click': function(){
							rename(item)
						}
					},
					{
						'text':'移动',
						'click': function(){
							movecopy([item],'move')
						}
					},
					{
						'text':'复制',
						'click': function(){
							movecopy([item],'copy')
						}
					},
					{
						'text':'删除',
						'click': function(){
							remove([item])
						}
					}
				]
			}

			if(item.type == 'directory')
				menu.splice(2,1)
			
			menu.forEach(function(element){element['className'] = 'item'})
			let popup = buildMenu(menu)
			if(window.innerHeight - this.getBoundingClientRect().bottom < 240){
				popup.classList.add('up')
			}
			documentItem.appendChild(popup)
			popup.focus()
		}

		documentItem.appendChild(selectButton)
		itemContent.appendChild(baseColumn)
		itemContent.appendChild(flexColumnOne)
		itemContent.appendChild(flexColumnTwo)
		itemContent.appendChild(actionColumn)
		documentItem.appendChild(itemContent)
		return documentItem
	}

	function syncOperationPanel(){
		let selected = getSelected()
		selectCounter.innerHTML = `已选中 ${selected.length} 项`
		if(selected.length == 0){
			selectCounter.innerHTML = ''
			if(workingDirectory == '/'){
				defaultOperation.innerHTML = '上传文件'
				operationPanel.className = 'operation-panel root'
				defaultOperation.onclick = function(){
					uploader.createTask()
				}
			}
			else if(care){
				defaultOperation.innerHTML = '恢复文件夹'
				operationPanel.className = 'operation-panel tomb'
				defaultOperation.onclick = function(){
					recover()
				}
			}	
			else{
				defaultOperation.innerHTML = '共享文件夹'
				operationPanel.className = 'operation-panel normal'
				defaultOperation.onclick = function(){
					//
				}			
			}

		}
		else if(selected.length == 1){
			if(selected[0].status == 0){
				defaultOperation.innerHTML = '恢复'
				operationPanel.className = 'operation-panel delete'
				defaultOperation.onclick = function(){
					recover(getSelected())
				}
			}
			else if(selected[0].type == 'directory'){
				defaultOperation.innerHTML = '共享文件夹'
				operationPanel.className = 'operation-panel directory'
				defaultOperation.onclick = function(){
					//
				}
			}
			else{
				defaultOperation.innerHTML = '共享'
				operationPanel.className = 'operation-panel file'
				defaultOperation.onclick = function(){
					//
				}
			}
		}
		else{
			let deletes = selected.filter(function(item){return item.status == 0})
			if(deletes.length==selected.length){
				defaultOperation.innerHTML = '恢复'
				operationPanel.className = 'operation-panel delete'
				defaultOperation.onclick = function(){
					recover(getSelected())
				}
			}
			else if(deletes.length == 0){
				defaultOperation.innerHTML = '下载'
				operationPanel.className = 'operation-panel multiple'
				defaultOperation.onclick = function(){
					download(getSelected())
				}
			}
			else{
				operationPanel.className = 'operation-panel mess'
			}
		}
	}

	function select(item){
		let visible = getVisible()
		if(typeof(item) == "undefined"){
			let set = !(visible.some(function(item){return item.selected == true}))
			visible.forEach(function(item){item.selected = set})
		}
		else{
			if(item['selected'] == true)
				item['selected'] = false
			else
				item['selected'] = true
		}
		Array.from(listBody.children).forEach(function(line,index){
			if(visible[index].selected == true)
				line.classList.add('selected')
			else
				line.classList.remove('selected')
		})
		let selected = getSelected()
		if(selected.length == 0)
			documentList.classList.remove('select','all')
		else{
			documentList.classList.add('select')
			if(selected.length == visible.length)
				documentList.classList.add('all')
			else
				documentList.classList.remove('all')
		}
		syncOperationPanel()
	}

	function mkdir(){
		let item = {
			'extension': '',
			'modify': '',
			'name': '',
			'owner': 'self',
			'size': null,
			'source': '',
			'status': 1,
			'type': 'directory'
		}
		all.unshift(item)
		let documentItem = buildLine(all[0])
		listBody.insertBefore(documentItem,listBody.firstChild)
		let itemName = documentItem.getElementsByClassName('item-name')[0]
		itemName.classList.add('edit')
		itemName.innerHTML = ''
		let input = createElement('input','')
		itemName.appendChild(input)
		input.focus()
		input.onclick = function(event){
			event.stopPropagation()
		}
		input.onkeyup = function(event){
			if(event.which == 13){
				input.blur()
			}
		}
		input.onblur = function(){
			let name = this.value
			if(name == ''){
				notify("请为新文件夹命名。",'error')
				all.shift()
				documentItem.parentNode.removeChild(documentItem)
			}
			else{
				request('POST',`${apiHost}/makedir`,`dir=${workingDirectory}&name=${name}`)
				.then(function(jsonBack){
					if(jsonBack['code'] == 200){
						all[0] = jsonBack['data']
						order = -1
						list()
						notify(`已创建文件夹“${jsonBack['data']['name']}”。`,'success')
					}
					else{
						all.shift()
						documentItem.parentNode.removeChild(documentItem)
						notify(errorReadable(jsonBack['message']),'error')
					}
				})
			}
		}		
	}

	function download(items){

		let name = items.map(function(item){return item['name']})
		name = name.join('|')

		let directoryName = getDirectoryName()
		
		if(items.length == 1 && items[0]['type'] != 'directory'){
			let a = createElement('a','')
			a.href = `${apiHost}/download/${items[0].name}?source=${items[0].source}`
			a.download = items[0].name
			a.click()
		}

		else{
			request('POST',`${apiHost}/compress`,`dir=${workingDirectory}&name=${name}`)
			.then(function(jsonBack){
				if(jsonBack['code']==200){
					let zipArchive = ''
					if(items.length == 1){
						zipArchive = `${items[0].name}.zip`
					}
					else{
						zipArchive = `${directoryName}.zip`
					}
					let a = createElement('a','')
					a.href = `${apiHost}/download/${zipArchive}?tag=${jsonBack['data']['tag']}`
					a.download = zipArchive
					a.click()
				}
				else{
					notify(errorReadable(jsonBack['message']),'error')
				}
			})
		}
	}


	function rename(item){
		let itemName = listBody.getElementsByClassName('document-item')[getVisible().indexOf(item)].getElementsByClassName('item-name')[0]
		itemName.classList.add('edit')
		itemName.innerHTML = ''
		let input = createElement('input','')
		input.value = item['name']
		itemName.appendChild(input)
		input.focus()
		let nameRange = (item['extension'].length == 0) ? item['name'].length : item['name'].length - item['extension'].length - 1
		input.setSelectionRange(0,nameRange)
		input.onclick = function(event){
			event.stopPropagation()
		}
		input.onkeyup = function(event){
			if(event.which == 13){
				input.blur()
			}
		}
		input.onblur = function(){
			let nameChange = this.value
			if(illegalName(nameChange)){
				notify('文件名不合法。','error')
				return
			}
			if(nameChange == item['name']){
				itemName.classList.remove('edit')
				itemName.innerHTML = nameChange
			}
			else{
				request('POST',`${apiHost}/rename`,`dir=${workingDirectory}&name=${item['name']}&rename=${nameChange}`)
				.then(function(jsonBack){
					if(jsonBack['code'] == 200){
						item['name'] = jsonBack['data']['name']
						item['extension'] = jsonBack['data']['extension']
						order = -1
						list()
						notify('重命名完成。','success')
					}
					else{
						notify(errorReadable(jsonBack['message']),'error')
					}
				})
			}
		}
	}


	function smash(items){

		let titleContent = `永久删除 ${items.length} 个项目？`
		let defaultContent = '永久删除'
		let optionalContent = '取消'
		let selectedName = ''

		let name = items.map(function(item){return item['name']})
		name = name.join('|')

		if(items.length == 1){
			selectedName = items[0]['name']
		}
		else{
			selectedName = `${items.length} 个项目`
		}

		let directoryName = getDirectoryName()
		let questionContent = `确实要将“<b>${selectedName}</b>”从 <b>${directoryName}</b> 中永久删除吗？`

		let confirmWindow = new ConfirmWindow(titleContent,questionContent,defaultContent,optionalContent)
		confirmWindow.defaultButton.focus()
		confirmWindow.defaultButton.onclick = function(){
			confirm()
			confirmWindow.quit()
		}

		function confirm(){
			request('POST',`${apiHost}/smash`,`dir=${workingDirectory}&name=${name}`)
			.then(function(jsonBack){
				if(jsonBack['code'] == 200){
					items.forEach(function(item){
						all.splice(all.indexOf(item),1)
					})
					list()
				}
			})
		}
	}


	function remove(items){

		let titleContent = ''
		let defaultContent = '删除'
		let optionalContent = '取消'
		let selectedName = ''

		let name = items.map(function(item){return item['name']})
		name = name.join('|')

		if(items.length == 1){
			if(items[0]['type'] == 'directory')
				titleContent = '是否删除文件夹？'
			else
				titleContent = '是否删除文件？'
			selectedName = items[0]['name']
		}
		else{
			titleContent = `删除 ${items.length} 个项目？`
			selectedName = `${items.length} 个项目`
		}

		let directoryName = getDirectoryName()
		let questionContent = `确实要将“<b>${selectedName}</b>”从 <b>${directoryName}</b> 中删除吗？`
		
		let confirmWindow = new ConfirmWindow(titleContent,questionContent,defaultContent,optionalContent)
		confirmWindow.defaultButton.focus()
		confirmWindow.defaultButton.onclick = function(){
			confirm()
			confirmWindow.quit()
		}

		function confirm(){
			request('POST',`${apiHost}/remove`,`dir=${workingDirectory}&name=${name}`)
			.then(function(jsonBack){
				if(jsonBack['code'] == 200){
					items.forEach(function(item){
						item['status'] = 0
						item['modify'] = jsonBack['data']['modify']
					})
					list()
				}
				else{
					notify(errorReadable(jsonBack['message']),'error')
				}
			})
		}
	}

	
	function recover(items){

		let titleContent = ''
		let bodyFragment = ''
		let defaultContent = '恢复'
		let optionalContent = '取消'
		let headerText = ''
		let informWindow = {}
		let directoryName = getDirectoryName()
		let directory = workingDirectory
		let special = false

		if(typeof(items) == "undefined"){
			directory = directory.slice(0,directory.length - directoryName.length - 1)
			directory = (directory == '') ? '/' : directory
			items = [{'name':directoryName,'type':'directory'}]
			special = true
		}
		
		let name = items.map(function(item){return item['name']})
		name = name.join('|')

		if(items.length==1&&items[0]['type']!='directory'){
			titleContent = items[0]['name']
			bodyFragment = singleStatus(items[0],directoryName)
			informWindow = new InformWindow(titleContent,bodyFragment,defaultContent,optionalContent)
			informWindow.defaultButton.onclick = function(event){
				informWindow.quit()
				confirm()
			}
		}

		else{
			let itemsExtend = []
			if(items.length == 1){ // is one directory
				titleContent = items[0]['name']
				headerText = `${directory}/${items[0]['name']}`
			}
			else{
				titleContent = `恢复 ${items.length} 个项目…`
				headerText = directoryName
				itemsExtend = itemsExtend.concat(items)
			}
			request('POST',`${apiHost}/status`,`dir=${directory}&name=${name}`)
			.then(function(jsonBack){
				if(jsonBack['code'] == 200){
					itemsExtend = itemsExtend.concat(jsonBack['data'])
					bodyFragment = multipleStatus(itemsExtend,headerText)
					defaultContent = (itemsExtend.length > 0) ? '恢复所有文件' : '恢复'
					informWindow = new InformWindow(titleContent,bodyFragment,defaultContent,optionalContent)
					informWindow.defaultButton.onclick = function(){
						informWindow.quit()
						confirm()
					}
				}
			})
		}
		

		function confirm(){
			request('POST',`${apiHost}/recover`,`dir=${directory}&name=${name}`)
			.then(function(jsonBack){
				if(jsonBack['code'] == 200){
					items.forEach(function(item){
						item['status'] = 1
						item['modify'] = jsonBack['data']['modify']
					})
					if(special)
						load()
					else
						list()
				}
				else{
					notify(errorReadable(jsonBack['message']),'error')
				}
			})
		}

	}

	function movecopy(items,action){

		let titleContent = (action == 'move') ? `将 ${items.length} 个项目移动到…` : `将 ${items.length} 个项目复制到…`
		let defaultContent = (action == 'move') ? '移动' : '复制'
		let selectedDirectory = ''
		let informWindow

		let name = items.map(function(item){return item['name']})
		name = name.join('|')

		request('GET',`${apiHost}/tree`)
		.then(function(jsonBack){
			if(jsonBack['code']==200){
				let selector = createElement('div','selector')
				let tree = jsonBack['data']
				tree['name'] = 'Dropbox'
				informWindow = new InformWindow(titleContent,selector,defaultContent,'取消',['no-close','center'])
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
				selectedDirectory = tag.path
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
			let apiPath = (action == 'move') ? 'move' : 'copy'
			if (!selectedDirectory) return
			if (workingDirectory == selectedDirectory && action == 'move'){
				notify('文件已在相应文件夹中。','error')
				return
			}
			request('POST',`${apiHost}/${apiPath}`,`src=${workingDirectory}&dst=${selectedDirectory}&name=${name}`)
			.then(function(jsonBack){
				if(jsonBack['code'] == 200){
					if(action == 'move'){
						items.forEach(function(item){
							all.splice(all.indexOf(item),1)
						})
						list()
					}
					else if(workingDirectory == selectedDirectory){
						load()
					}
				}
				else{
					notify(errorReadable(jsonBack['message']),'error')
				}
			})
		}
	}

}


function singleStatus(item,directoryName){
	let bodyFragment = createElement('div','status single')
	let mediaIcon = createElement('div','media-icon')
	mediaIcon.innerHTML = iconDetect(item['type'],true)
	let itemName = createElement('div','item-name')
	itemName.innerHTML = item['name']
	let itemDirectory = createElement('div','item-directory')
	itemDirectory.innerHTML = directoryName
	let itemSize = createElement('div','item-size')
	itemSize.innerHTML = sizeReadable(item['size'])
	let itemModify = createElement('div','item-modify')
	itemModify.innerHTML = `您在 ${timeReadable(item['modify'])} 删除`
	bodyFragment.appendChild(mediaIcon)
	bodyFragment.appendChild(itemName)
	bodyFragment.appendChild(itemDirectory)
	bodyFragment.appendChild(itemSize)
	bodyFragment.appendChild(itemModify)
	return bodyFragment
}

function multipleStatus(items,headerText){
	let bodyFragment = createElement('div','status multiple')
	let header = createElement('div','header')
	header.innerHTML = headerText
	let itemContainer = createElement('div','container')
	items.forEach(function(item){
		let itemContent = createElement('div','item-content')
		let mediaIcon = createElement('div','media-icon')
		mediaIcon.innerHTML = iconDetect(item['type'])
		let itemName = createElement('div','item-name')
		itemName.innerHTML = item['name']
		let itemSize = createElement('div','item-size')
		itemSize.innerHTML = sizeReadable(item['size'])
		itemContent.appendChild(mediaIcon)
		itemContent.appendChild(itemName)
		itemContent.appendChild(itemSize)
		itemContainer.appendChild(itemContent)
	})
	if(items.length==0){
		let emptyTip = createElement('div','empty-tip')
		emptyTip.innerHTML = '这个文件夹是空的'
		itemContainer.appendChild(emptyTip)
	}
	bodyFragment.appendChild(header)
	bodyFragment.appendChild(itemContainer)
	return bodyFragment
}


function ConfirmWindow(titleContent,questionContent,defaultContent,optionalContent){
	let mask = createElement('div','mask')
	mask.classList.add('confirm')
	let confirmWindow = createElement('div','window')
	let title = createElement('div','title')
	let titleText = createElement('div','text')
	titleText.innerHTML = titleContent
	let closeButton = createElement('button','close')
	title.appendChild(titleText)
	title.appendChild(closeButton)
	let question = createElement('div','question')
	let questionText = createElement('div','text')
	questionText.innerHTML = questionContent
	let operate = createElement('div','operate')
	let padBlock = createElement('div','pad')
	let defaultButton = createElement('button','default')
	defaultButton.innerHTML = defaultContent
	let optionalButton = createElement('button','optional')
	optionalButton.innerHTML = optionalContent
	operate.appendChild(padBlock)
	operate.appendChild(defaultButton)
	operate.appendChild(optionalButton)
	question.appendChild(questionText)
	question.appendChild(operate)
	confirmWindow.appendChild(title)
	confirmWindow.appendChild(question)
	confirmWindow.onclick = function(event){
		event.stopPropagation()
	}
	mask.onclick = function(){
		optionalButton.click()
	}
	closeButton.onclick = function(){
		optionalButton.click()
	}
	optionalButton.onclick = function(){
		quit()
	}
	mask.appendChild(confirmWindow)
	document.body.appendChild(mask)
	// resolveButton.focus()

	function quit(){
		mask.parentNode.removeChild(mask)
	}

	this.quit = quit
	this.operate = operate
	this.defaultButton = defaultButton
	this.optionalButton = optionalButton

}


function InformWindow(titleContent,bodyFragment,defaultContent,optionalContent,style=[]){
	let mask = createElement('div','mask')
	mask.classList.add('inform')
	if(style.indexOf('center')!=-1)
		mask.classList.add('center')
	let informWindow = createElement('div','window')
	if(style.indexOf('upload')!=-1)
		informWindow.classList.add('upload')
	let title = createElement('div','title')
	let titleText = createElement('div','text')
	titleText.innerHTML = titleContent
	let closeButton = createElement('button','close')
	title.appendChild(titleText)
	if(style.indexOf('no-close')==-1)
		title.appendChild(closeButton)
	let body = createElement('div','body')
	if(style.indexOf('no-frame')==-1)
		body.classList.add('frame')
	body.appendChild(bodyFragment)
	let operate = createElement('div','operate')
	let padBlock = createElement('div','pad')
	let defaultButton = createElement('button','default')
	defaultButton.innerHTML = defaultContent
	let optionalButton = createElement('button','optional')
	optionalButton.innerHTML = optionalContent
	operate.appendChild(padBlock)
	operate.appendChild(optionalButton)
	operate.appendChild(defaultButton)
	informWindow.appendChild(title)
	informWindow.appendChild(body)
	informWindow.appendChild(operate)
	informWindow.onclick = function(event){
		event.stopPropagation()
	}
	if(style.indexOf('default-reverse')==-1){
		mask.onclick = function(){
			optionalButton.click()
		}
		closeButton.onclick = function(){
			optionalButton.click()
		}
	}
	else{
		mask.onclick = function(){
			defaultButton.click()
		}
		closeButton.onclick = function(){
			defaultButton.click()
		}
	}
	optionalButton.onclick = function(){
		quit()
	}
	mask.appendChild(informWindow)
	document.body.appendChild(mask)

	function quit(){
		mask.parentNode.removeChild(mask)
	}

	this.quit = quit
	this.operate = operate
	this.defaultButton = defaultButton
	this.optionalButton = optionalButton
}


function buildMenu(menu){
	let menuContainer = createElement('div','menu')
	menu.forEach(function(item,index){
		let menuItem = createElement('div',item.className)
		menuItem.innerHTML = item.text
		menuItem.onclick = item.click
		menuItem.addEventListener('click',function(event){
			event.stopPropagation()
			menuContainer.blur()
		})
		menuContainer.appendChild(menuItem)
	})
	menuContainer.tabIndex = '0'
	menuContainer.hideFocus = true
	menuContainer.onblur = function(event){
		event.stopPropagation()
		this.parentNode.removeChild(this)
	}
	return menuContainer
}