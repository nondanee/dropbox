function Version(){
	let path
	let all
	let contentHistory
	let itemName
	let documentList
	let open = false

	function parse(){
		path = decodeURIComponent(window.location.hash).split('history=').pop()
		itemName.innerHTML = path.split('/').pop()
	}

	function init(){
		document.title = '文件 - Dropbox'
		contentHistory = createElement('div','content version')
		let titleBar = createElement('div','title-bar')
		let containerTitle = createElement('div','container-title')
		itemName = createElement('div','item-name')
		let containerName = createElement('div','container-name')
		containerName.innerHTML = '版本历史记录'
		containerTitle.appendChild(itemName)
		containerTitle.appendChild(containerName)
		titleBar.appendChild(containerTitle)
		contentHistory.appendChild(titleBar)
		let documentContainer = createElement('div','document-container')
		let containerTip = createElement('div','container-tip')
		// containerTip.innerHTML = '您可以恢复下面的任何版本，使其成为最新文件。 不过系统仍然会保存所有其他版本。'
		containerTip.innerHTML = '您可以查看和下载下面任何版本的文件，不会影响当前保存的最新版本。'
		documentContainer.appendChild(containerTip)
		documentList = createElement('div','document-list')
		documentContainer.appendChild(documentList)
		contentHistory.appendChild(documentContainer)
		document.body.appendChild(contentHistory)
	}

	function buildLine(item){
		let itemContent = createElement('div','item-content')
		let columnOne = createElement('div','column')
		let mediaIcon = createElement('div','media-icon')
		mediaIcon.innerHTML = iconDetect(item.type)
		let itemInformation = createElement('div','item-information')
		let upperLineOne = createElement('div','upper-line')
		upperLineOne.innerHTML = item.name
		let lowerLineOne = createElement('div','lower-line')
		lowerLineOne.innerHTML = timeReadable(item.modify).split(' ').pop()
		itemInformation.appendChild(upperLineOne)
		itemInformation.appendChild(lowerLineOne)
		columnOne.appendChild(mediaIcon)
		columnOne.appendChild(itemInformation)
		let columnTwo = createElement('div','column')
		let modifyInformation = createElement('div','modify-information')
		let upperLineTwo = createElement('div','upper-line')
		let lowerLineTwo = createElement('div','lower-line')
		lowerLineTwo.innerHTML = '网络'
		modifyInformation.appendChild(upperLineTwo)
		modifyInformation.appendChild(lowerLineTwo)
		columnTwo.appendChild(modifyInformation)
		let columnThree = createElement('div','column')
		let itemSize = createElement('div','item-size')
		itemSize.innerHTML = sizeReadable(item.size)
		let button = createElement('button','view')
		button.innerHTML = '查看'
		columnThree.appendChild(itemSize)
		columnThree.appendChild(button)
		// itemContent.onclick = function(){
		// 	window.location.hash = `preview=${path}&mark=${item.mark}`
		// }
		
		if(item.action == 'create'){
			upperLineTwo.innerHTML = `由${item.operator}添加。`
			itemContent.appendChild(columnOne)
			itemContent.appendChild(columnTwo)
			itemContent.appendChild(columnThree)
		}
		else if(item.action == 'recover'){
			upperLineTwo.innerHTML = `由${item.operator}恢复。`
			itemContent.appendChild(columnOne)
			itemContent.appendChild(columnTwo)
			itemContent.appendChild(columnThree)
		}
		else if(item.action == 'rename'){
			upperLineOne.innerHTML = `${item.operator}将文件“${item.name}”重命名为“${item.rename}”。`
			lowerLineOne.innerHTML += ' • 网络'
			itemContent.appendChild(columnOne)
			itemContent.appendChild(columnThree)
		}
		else if(item.action == 'delete'){
			upperLineOne.innerHTML = `已被${item.operator}删除。`
			lowerLineOne.innerHTML += ' • 网络'
			itemSize.innerHTML = '--'
			mediaIcon.innerHTML = ''
			itemContent.appendChild(columnOne)
			itemContent.appendChild(columnThree)
		}
		
		return itemContent
	}

	function list(){
		let fragment = document.createDocumentFragment()
		let datePrevious = dateReadable(all[0]['modify'])
		fragment.appendChild(separate())
		all.forEach(function(item){
			let dateCurrent = dateReadable(item['modify'])
			if(datePrevious!=dateCurrent){
				datePrevious=dateCurrent
				fragment.appendChild(separate())
			}
			let line = buildLine(item)
			fragment.appendChild(line)
		})
		documentList.innerHTML = ''
		documentList.appendChild(fragment)

		function separate(){
			let dateSeparate = createElement('div','date-separate')
			dateSeparate.innerHTML = datePrevious
			return dateSeparate
		}
	}

	function load(){
		if(!open){
			init()
			open = true
		}
		parse()
		request('GET',`${apiHost}/history?path=${encodeURIComponent(path)}`)
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
		contentHistory.parentNode.removeChild(contentHistory)
		open = false
	}
	this.close = close

}