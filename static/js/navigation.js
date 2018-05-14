function Sidebar(){
	
	const optionFile = createElement('button')
	optionFile.innerHTML = '我的文件'
	optionFile.onclick = function(){
		window.location.hash = '/'
	}
	const optionShare = createElement('button')
	optionShare.innerHTML = '共享'
	optionShare.onclick = function(){
		//
	}
	const optionRecycle = createElement('button')
	optionRecycle.innerHTML = '已删除文件'
	optionRecycle.onclick = function(){
		window.location.hash = 'recycle'
	}

	const optionSet = new Array(optionFile,optionShare,optionRecycle)

	function init(){
		let nav = createElement('div','nav')
		let logo = createElement('div','logo')
		logo.onclick = function(){
			logo.click()
		}
		let title = createElement('div','title')
		title.innerHTML = '文件'
		title.onclick = function(){
			optionFile.click()
		}
		let option = createElement('div','option')
		optionSet.forEach(function(element){
			let item = createElement('div','item')
			item.appendChild(element)
			option.appendChild(item)
		})
		let tab = createElement('div','tab')
		let productType = createElement('div','type')
		productType.innerHTML = '个人'
		let member = createElement('div','member')
		member.innerHTML = '只有您'
		let memberSwitch = createElement('div','switch')
		tab.appendChild(productType)
		tab.appendChild(member)
		tab.appendChild(memberSwitch)
		nav.appendChild(logo)
		nav.appendChild(title)
		nav.appendChild(option)
		nav.appendChild(tab)
		document.body.appendChild(nav)
	}
	init()

	function syncOption(){
		if(window.location.hash.slice(1)[0] == '/'){
			optionSet.forEach(function(option){option.classList.remove('focus')})
			optionFile.classList.add('focus')
		}
		else if(window.location.hash.slice(1).indexOf('recycle') == 0){
			optionSet.forEach(function(option){option.classList.remove('focus')})
			optionRecycle.classList.add('focus')			
		}
	}
	this.syncOption = syncOption
}

const siderbar = new Sidebar()
const container = new Container()
const uploader = new Uploader()
const viewer = new Viewer()
const recycle = new Recycle()
const version = new Version()

window.onload = function(){
	if(window.location.hash == ''|| window.location.hash == '#')
		window.location.hash = '/'
	else
		router()
}
window.onpopstate = function(event) {
 	router()
}
window.onbeforeunload = function(event){
	container.storePreference()
}


function router(){
	siderbar.syncOption()
	if(window.location.hash.indexOf('#preview')==0){
 		viewer.load()
 	}
 	else if(window.location.hash.indexOf('#recycle')==0){
 		recycle.load()
 	}
 	else if(window.location.hash.indexOf('#history')==0){
 		if(viewer.opened())
 			viewer.close()
		version.load()
 	}
 	else{
 		if(viewer.opened())
 			viewer.close()
 		if(recycle.opened())
 			recycle.close()
 		else if(version.opened())
 			version.close()
 		else{
 			container.load()
 		}
 	}
}