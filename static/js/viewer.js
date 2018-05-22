function Viewer(){
	let path
	let mark
	let item
	let previewWindow
	let itemContent
	let open = false

	function parse(){
		path = decodeURIComponent(window.location.hash).split('preview=').pop()
		mark = (path.split('&version=').length==2) ? path.split('&version=').pop() : ''
		path = (path.split('&version=').length==2) ? path.split('&version=').shift() : path
		document.title = '文件 - Dropbox'
	}

	function load(){
		parse()
		query()
	}
	this.load = load
	
	function query(){
		request('GET',`${apiHost}/preview?path=${encodeURIComponent(path)}&version=${mark}`)
		.then(function(jsonBack){
			if(jsonBack['code']==200){
				item = jsonBack['data']
				if(!open)
					init()
				render()
				open = true
			}
			else{
				notify(errorReadable(jsonBack['message']),'error')
			}
		})
	}

	function opened(){
		if(open)
			return true
		else
			return false
	}
	this.opened = opened

	function close(){
		previewWindow.parentNode.removeChild(previewWindow)
		open = false
	}
	this.close = close

	function init(){
		previewWindow = createElement('div','preview-window')
		let titleBar = createElement('div','title-bar')
		let backButton = createElement('button','back')
		backButton.onclick = function(){
			history.back()
		}
		let itemInformation = createElement('div','item-information')
		let itemName = createElement('div','item-name')
		itemName.innerHTML = item.name
		let itemModify = createElement('div','item-modify')
		itemModify.innerHTML = '最后修改时间'
		let modifyLink = createElement('div','link')
		modifyLink.innerHTML = '在 ' + timeReadable(item.modify)
		modifyLink.onclick = function(){
			window.location.hash = `history=${path}`
		}
		itemModify.appendChild(modifyLink)
		itemInformation.appendChild(itemName)
		itemInformation.appendChild(itemModify)
		let padBlock = createElement('div','pad')
		let operate = createElement('div','operate')
		let defaultButton = createElement('button','default')
		defaultButton.classList.add('share')
		defaultButton.innerHTML = '共享'
		defaultButton.onclick = function(){

		}
		let optionalButton = createElement('button','optional')
		optionalButton.classList.add('download')
		optionalButton.innerHTML = '下载'
		optionalButton.onclick = function(){
			download()
		}
		let moreButton = createElement('button','more')
		moreButton.onclick = function(){
			let menu = [
				{
					'text': '下载',
					'className': 'item',
					'click': function(){
						optionalButton.click()
					}
				},
				{
					'text': '版本历史记录',
					'className': 'item',
					'click': function(){
						modifyLink.click()
					}
				},
				{
					'text': '',
					'className': 'rule'
				},
				{
					'text': '禁用评论',
					'className': 'item',
				},
				{
					'text': '显示未解决的评论',
					'className': 'item',
				},
				{
					'text': '退订通知',
					'className': 'item',
				},
			]
			let popup = buildMenu(menu)
			operate.appendChild(popup)
			popup.focus()
		}
		itemContent = createElement('div','item-content')
		if(!mark)
			operate.appendChild(defaultButton)
		operate.appendChild(optionalButton)
		operate.appendChild(moreButton)
		titleBar.appendChild(backButton)
		titleBar.appendChild(itemInformation)
		titleBar.appendChild(padBlock)
		titleBar.appendChild(operate)
		previewWindow.appendChild(titleBar)
		previewWindow.appendChild(itemContent)
		document.body.appendChild(previewWindow)
	}

	function download(){
		let a = createElement('a','')
		a.href = `${apiHost}/download/${item.name}?source=${item.source}`
		a.download = item.name
		a.click()
	}

	function render(){
		itemContent.innerHTML = ''

		if(item.type.indexOf('image')!=-1){
			let imageContainer = createElement('img')
			imageContainer.src = `${apiHost}/source/${item.name}?source=${item.source}`
			itemContent.appendChild(imageContainer)
		}

		else if(item.type=='audio/mpeg'||item.type=='audio/mp3'){
			let audiojsImport = createElement('script')
			audiojsImport.src = '/static/audio.js/audio.min.js'
			audiojsImport.onload = function(){
				audiojs.events.ready(function() {
					audiojs.createAll()
				})
			}
			previewWindow.appendChild(audiojsImport)
			let audioContainer = createElement('audio','')
			audioContainer.setAttribute('preload','auto')
			audioContainer.src = `${apiHost}/source/${item.name}?source=${item.source}`
			itemContent.appendChild(audioContainer)
		}

		else if(item.type=='video/mp4'){
			let videojsImport = createElement('script')
			videojsImport.src = '/static/video.js/video.min.js'
			previewWindow.appendChild(videojsImport)
			let videocssImport = createElement('link','')
			videocssImport.rel = 'stylesheet'
			videocssImport.href = '/static/video.js/video-js.min.css'
			previewWindow.appendChild(videocssImport)
			let videoContainer = createElement('video','video-js vjs-big-play-centered')
			videoContainer.setAttribute('controls','')
			videoContainer.setAttribute('preload','auto')
			videoContainer.setAttribute('data-setup','{}')
			let videoSource = createElement('source','')
			videoSource.type = 'video/mp4'
			videoSource.src = `${apiHost}/source/${item.name}?source=${item.source}`
			videoContainer.appendChild(videoSource)
			itemContent.appendChild(videoContainer)
		}

		else if(item.type=='application/pdf'){
			let pdfIframe = createElement('iframe')
			pdfIframe.allowFullscreen = true
			pdfIframe.src = `${apiHost}/pdf/${item.name}?source=${item.source}`
			itemContent.appendChild(pdfIframe)
		}

		else if(item.type.indexOf('officedocument')!=-1||item.type.indexOf('vnd.ms-')!=-1||item.type.indexOf('msword')!=-1){
			let pdfIframe = createElement('iframe')
			pdfIframe.classList.add('office')
			pdfIframe.src = `${apiHost}/office/${item.name}?source=${item.source}`
			itemContent.appendChild(pdfIframe)
		}
		else{
			let errorBlock = createElement('div','error')
			let image = createElement('div','image')
			image.innerHTML = '<img src="https://cfl.dropboxstatic.com/static/images/previews/error/filetype_not_supported_1x-vflmIVODZ.png" srcset="https://cfl.dropboxstatic.com/static/images/previews/error/filetype_not_supported_2x-vflE8HW8X.png 2x" alt="">'
			let message = createElement('div','message')
			message.innerHTML = '该文件无法预览'
			let itemAbout = createElement('div','item-about')
			itemAbout.innerHTML  = `${item.name} · ${sizeReadable(item.size)}`
			let downloadButton = createElement('button','download')
			downloadButton.innerHTML = '下载'
			downloadButton.onclick = function(){
				download()
			}
			let link = createElement('a','link')
			link.innerHTML = '了解更多。'
			link.href = 'https://www.dropbox.com/help/files-folders/file-types-that-preview'
			link.target = '_blank'
			errorBlock.appendChild(image)
			errorBlock.appendChild(message)
			errorBlock.appendChild(itemAbout)
			errorBlock.appendChild(downloadButton)
			errorBlock.appendChild(link)
			itemContent.appendChild(errorBlock)
		}
	}

}