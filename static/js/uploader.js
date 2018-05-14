function Uploader(){

	let indicatorOpened = false
	let indicator = createElement('div','upload-indicator')
	let message = createElement('div','message')
	let overall = createElement('div','cursor')
	let taskList = createElement('div','task-list')
	let countdown = createElement('div','countdown')
	let informWindow = null
	let previousCheck = {'time': new Date().getTime(),'chunk': 0}
	let queue = []

	function initIndicator(){
		let progress = createElement('div','progress')
		let icon = createElement('div','icon')
		let detailButton = createElement('button','detail')
		detailButton.innerHTML = '查看详情'
		detailButton.onclick = function(){
			hideIndicator()
			detailWindow()
		}
		let closeButton = createElement('button','close')
		closeButton.innerHTML = '关闭'
		closeButton.onclick = function(){
			hideIndicator()
		}
		indicator.appendChild(progress)
		progress.appendChild(overall)
		indicator.appendChild(icon)
		indicator.appendChild(message)
		indicator.appendChild(detailButton)
		indicator.appendChild(closeButton)
	}
	initIndicator()

	function showIndicator(){
		if(!indicatorOpened)
			document.body.appendChild(indicator)
		indicatorOpened = true
	}
	// this.showIndicator = showIndicator

	function hideIndicator(){
		if(indicatorOpened)
			indicator.parentNode.removeChild(indicator)
		indicatorOpened = false
	}
	// this.hideIndicator = hideIndicator

	// function indicatorCheck(){
	// 	console.log(indicator.getBoundingClientRect())
	// }
	// this.indicatorCheck = indicatorCheck

	function buildDetail(item){
		let taskItem = createElement('div','task-item')
		if(item.status == 200)
			taskItem.classList.add('success')
		else if(item.status == -1)
			taskItem.classList.add('cancel')
		else if(item.status > 0)
			taskItem.classList.add('error')
		let itemInformation = createElement('div','item-information')
		let mediaIcon = createElement('div','media-icon')
		mediaIcon.innerHTML = iconDetect(item.type)
		let itemName = createElement('div','item-name')
		itemName.innerHTML = item.name
		let itemSize = createElement('div','item-size')
		itemSize.innerHTML = sizeReadable(item.size)
		itemInformation.appendChild(mediaIcon)
		itemInformation.appendChild(itemName)
		itemInformation.appendChild(itemSize)
		let taskStatus = createElement('div','task-status')
		if(item.status==0||item.status==200){
			let itemDirectory = createElement('div','item-directory')
			itemDirectory.innerHTML = (item.directory == '/') ? '文件' : '文件' + item.directory
			itemDirectory.onclick = function(){
				informWindow.defaultButton.onclick()
				window.location.hash = `${item.directory}`
			}
			taskStatus.appendChild(itemDirectory)
		}
		else if(item.status==-1){
			let message = createElement('div','message')
			message.innerHTML = '已取消'
			taskStatus.appendChild(message)
		}
		else{
			let messageError = createElement('div','message error')
			messageError.innerHTML = '上传错误'
			taskStatus.appendChild(messageError)
		}
		taskItem.appendChild(item.cursor)
		taskItem.appendChild(itemInformation)
		taskItem.appendChild(taskStatus)
		taskItem.appendChild(item.button)
		return taskItem
	}	

	function detailWindow(){
		refreshList()
		let defaultContent = queue.some(function(task){return task.status==0}) ? '隐藏' : '完成'
		informWindow = new InformWindow('上传详情',taskList,defaultContent,'添加更多文件',['no-close','center','upload','default-reverse','no-frame'])
		taskList.parentNode.appendChild(countdown)
		informWindow.defaultButton.onclick = function(){
			if(queue.some(function(task){return task.status==0})){
				informWindow.quit()
				showIndicator()
				informWindow = null				
			}
			else{
				informWindow.quit()
				informWindow = null
			}
		}
		informWindow.optionalButton.onclick = function(){
			createTask()
		}
	}

	function overallWatcher(){
		let currentTime = new Date().getTime()
		if(currentTime - previousCheck.time < 500) return // control
		
		let runningTaskSize = 0
		let runningTaskLoaded = 0
		let currentChuck = 0
		queue.forEach(function(task){
			if(task.status==0){
				runningTaskSize += task.size
				runningTaskLoaded += task.progress * task.size
				currentChuck += task.progress * task.size
			}
			else if(task.status==200){
				currentChuck += task.size
			}
			
		})
		overall.style.width = `${runningTaskLoaded / runningTaskSize * 100}%`
	
		let speed = (currentChuck - previousCheck.chunk) / (currentTime - previousCheck.time) * 1000 // unit: B/s
		previousCheck.chunk = currentChuck
		previousCheck.time = currentTime
		previousCheck.wait = (runningTaskSize - runningTaskLoaded) / speed
		syncUI()
	}

	function refreshList(){
		taskList.innerHTML = ''
		queue.forEach(function(item){
			taskList.appendChild(buildDetail(item))
		})
	}
	this.refreshList = refreshList

	function syncUI(){
		let running = queue.filter(function(task){if(task.status==0)return task})
		if(running.length == 0){
			let error = queue.filter(function(task){if(task.status>0&&task.status!=200)return task})
			let success = queue.filter(function(task){if(task.status==200)return task})
			if(error.length!=0){
				indicator.className = 'upload-indicator error'
				message.innerHTML = `已上传 ${success.length} 个文件，共 ${success.length + error.length} 个 - ${error.length} 个错误`
			}
			else{
				indicator.className = 'upload-indicator success'
				message.innerHTML = (success.length == 1) ? `已上传 ${success[0]['name']}` : `已上传 ${success.length} 个文件`
			}
			if(informWindow){informWindow.defaultButton.innerHTML = '完成'}
			countdown.classList.add('hide')
		}
		else{
			indicator.className = 'upload-indicator run'
			if(previousCheck.wait){
				let remainTime = secondReadable(previousCheck.wait)
				countdown.classList.remove('hide')
				countdown.innerHTML = `剩余 ${remainTime}`
				message.innerHTML = (running.length == 1) ? `正在上传 ${running[0]['name']} - 剩余 ${remainTime}` : `正在上传 ${running.length}个文件 - 剩余 ${remainTime}`
			}
			else{
				message.innerHTML = (running.length == 1) ? `正在上传 ${running[0]['name']}` : `正在上传 ${running.length}个文件`
			}
			if(!informWindow&&!indicatorOpened){showIndicator()}
			if(informWindow){informWindow.defaultButton.innerHTML = '隐藏'}
		}
	}

	function secondReadable(second){
		second = parseInt(second)
		let minute = parseInt(second / 60)
		let hour = parseInt(minute / 60)
		let day = parseInt(hour / 60)
		if(day)
			return `${day} 天`
		else if(hour)
			return `${hour} 小时`
		else if(minute)
			return `${minute} 分钟`
		else
			return `${second} 秒`
	}


	function uploadFile(file,item){
		let formData = new FormData()
		formData.append("file",file)
		let xhr = new XMLHttpRequest()
		let actionButton = createElement('button','action')
		actionButton.onclick = function(){
			item.status = -1
			xhr.abort()
			syncUI()
			refreshList()
		}
		item.button = actionButton
		refreshList()
		xhr.onreadystatechange = function(){
			if(xhr.readyState == 4 && xhr.status == 200){
				let jsonBack = JSON.parse(xhr.responseText)
				item.status = jsonBack['code']
				syncUI()
				refreshList()
				if(jsonBack['code']==200&&item.directory==container.getCwd()){
					container.add(jsonBack['data'])
				}
			}
		}
		xhr.upload.onprogress = function(event){
			if(event.lengthComputable) {
				item.progress = event.loaded/event.total
				item.cursor.style.width = `${item.progress*100}%`
				overallWatcher()
			}
		}
		xhr.open("POST",`${apiHost}/upload?dir=${item.directory}`)
		xhr.send(formData)
		
	}


	function createTask(){
		let directory = container.getCwd()
		let fileInput = document.createElement("input")
			fileInput.setAttribute("type","file")
			fileInput.setAttribute("multiple","multiple")
			fileInput.onchange = function () {
				let files = this.files
				if(files[0]){
					Array.from(files).forEach(function(file){
						let item = {
							'name': file.name,
							'size': file.size,
							'type': file.type,
							'directory': directory,
							'progress': 0,
							'cursor': createElement('div','cursor'),
							'status': 0
						}
						queue.push(item)
						uploadFile(file,item)
					})
				}
			}
			fileInput.click()
	}
	this.createTask = createTask


}

// status
// 0 running
// -1 cancel
// 200 success
// ??? error