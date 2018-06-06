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
		tab.onclick = function(){
			let menu = [
				{
					'text':'开始免费试用 Dropbox Business',
					'className': 'item disable'
				},
				{
					'text': '',
					'className': 'rule'
				},
				{
					'text':'个人',
					'className': 'item active'
				}
			]
			let popup = buildMenu(menu)
			nav.appendChild(popup)
			popup.focus()
		}
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

(function Pendant(){

	let corner = createElement('div','corner')
	let userAvatar = createElement('button','avatar')

	userAvatar.onclick = function(){
		let menu = [
			{
				'text':'设置',
				'className': 'item disable'
			},
			{
				'text': '安装',
				'className': 'item disable'
			},
			{
				'text': '',
				'className': 'rule'
			},
			{
				'text':'注销',
				'className': 'item',
				'click': function(){
					request('POST',`${apiHost}/signout`)
					.then(function(jsonBack){
						if(jsonBack['code'] == 200)
							window.location.href = '/'
						else
							notify(errorReadable(jsonBack['message']),'error')
					})
				}
			}
		]
		let popup = buildMenu(menu)

		request('GET',`${apiHost}/account`)
		.then(function(jsonBack){
			let account = jsonBack['data']
			let block = createElement('div','block')
			let user = createElement('div','user')
			let avatar = createElement('div','avatar')
			let name = createElement('div','name')
			name.innerHTML = account['name']
			user.appendChild(avatar)
			user.appendChild(name)

			let quota = createElement('div','quota')
			let progress = createElement('div','progress')
			let cursor = createElement('div','cursor')
			cursor.style.width = `${account['usage']/2147483648*100}%`
			progress.appendChild(cursor)
			quota.innerHTML = `已使用 ${sizeReadable(account['usage'])}（共 2 GB）`
			quota.insertBefore(progress,quota.firstChild)

			let update = createElement('div','update')
			update.innerHTML = '升级'
			update.onclick = function(event){
				window.open('https://www.dropbox.com/plans?trigger=direct')
			}

			block.appendChild(user)
			block.appendChild(quota)
			block.appendChild(update)
			popup.insertBefore(block,popup.firstChild)
			corner.appendChild(popup)
			popup.focus()
		})
	}
	corner.appendChild(userAvatar)
	document.body.appendChild(corner)
	
	let support = createElement('div','support')
	let more = createElement('button','more')
	more.onclick = function (){
		let menu = ['安装','移动','博客','工作机会','开发人员','联系我们','定价','版权','企业版','语言']	
		menu = menu.map(function(item){return {'text': item, 'className': 'item disable'}})
		let popup = buildMenu(menu)
		support.appendChild(popup)
		popup.focus()
	}
	let privacy = createElement('button','privacy')
	privacy.innerHTML = '隐私'
	privacy.onclick = function(){
		window.open("https://www.dropbox.com/privacy")
	}
	let help = createElement('button','help')
	help.innerHTML = '?'
	help.onclick = function(){
		window.open("https://www.dropbox.com/help")
	}
	support.appendChild(more)
	support.appendChild(privacy)
	support.appendChild(help)
	document.body.appendChild(support)
	
})()


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
		if(version.opened())
 			version.close()
 		viewer.load()
 	}
 	else if(window.location.hash.indexOf('#history')==0){
 		if(viewer.opened())
 			viewer.close()
		version.load()
 	}
 	else if(window.location.hash.indexOf('#recycle')==0){
 		recycle.load()
 	}
 	else{
 		if(viewer.opened()){
 			viewer.close()
 		}
 		else if(version.opened()){
 			version.close()
 		}
 		else{
 			if(recycle.opened())
 				recycle.close()
 			container.load()
 		}
 	}
}