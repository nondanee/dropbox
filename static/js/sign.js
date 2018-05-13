const headerSwitch = document.querySelector('.form>.header>.link:nth-child(1)')
const formBlock = document.querySelector('.form>.block')
const emailFormat = /^[0-9A-Za-zd]+([-_.][0-9A-Za-zd]+)*@([0-9A-Za-zd]+[-.])+[A-Za-zd]{2,5}$/
let mode
let emailAddress


function signUpMode(){
	let fragment = document.createDocumentFragment()
	let title = createElement('div','title')
	title.innerHTML = '注册'
	let modeSwitch = createElement('div','switch')
	modeSwitch.innerHTML = '或'
	let trigger = createElement('div','trigger')
	trigger.innerHTML = '登录账户'
	trigger.onclick = function(){
		signInMode()
	}
	modeSwitch.appendChild(trigger)
	let form = createElement('form','')
	let lastName = createElement('input','')
	lastName.type = 'text'
	lastName.placeholder = '姓'
	let lastNameError = createElement('div','message thin')
	let fisrtName = createElement('input','')
	fisrtName.type = 'text'
	fisrtName.placeholder = '名'
	let fisrtNameError = createElement('div','message thin')
	let email = createElement('input','')
	email.type = 'text'
	email.placeholder = '电子邮件'
	let emailError = createElement('div','message thin')
	let password = createElement('input','')
	password.type = 'password'
	password.placeholder = '密码'
	let passwordError = createElement('div','message thin')
	let checkbox = createElement('div','checkbox')
	checkbox.innerHTML = '我同意'
	let link = createElement('a','link')
	link.innerHTML = 'Dropbox 条款'
	link.onclick = function(event){
		event.stopPropagation()
	}
	checkbox.appendChild(link)
	let checkboxError = createElement('div','message thin')
	checkbox.onclick = function(){
		checkboxError.classList.remove('show')
		if(this.classList.contains('check'))
			this.classList.remove('check')
		else
			this.classList.add('check')
	}
	let button = createElement('button','')
	button.type = 'button'
	button.innerHTML = '注册'
	button.onclick = function(){
		let lastNameValue = lastName.value
		let fisrtNameValue = fisrtName.value
		let emailValue = email.value
		let passwordValue = password.value
		let argree = (checkbox.classList.contains('check')) ? true : false
		if(lastNameValue==''){
			lastNameError.classList.add('show')
			lastNameError.innerHTML = '请输入您的姓名'
			return
		}
		else if(fisrtNameValue==''){
			fisrtNameError.classList.add('show')
			fisrtNameError.innerHTML = '请输入您的名字'
			return
		}
		else if(emailValue==''){
			emailError.classList.add('show')
			emailError.innerHTML = '请输入一个电子邮件地址'
			return
		}
		else if(!emailFormat.test(emailValue)){
			emailError.classList.add('show')
			emailError.innerHTML = '请输入一个有效的电子邮件地址'
			return
		}
		else if(passwordValue==''){
			passwordError.classList.add('show')
			passwordError.innerHTML = '请输入密码'
			return
		}
		else if(!argree){
			checkboxError.classList.add('show')
			checkboxError.innerHTML = '请同意服务条款'
			return
		}
		let data = `email=${emailValue}&password=${passwordValue}&name=${lastNameValue} ${fisrtNameValue}`
		request('POST',`${apiHost}/signup`,data)
		.then(function(jsonBack){
			if(jsonBack['code'] == 200){
				emailAddress = emailValue
				signInMode()
			}
			else if(jsonBack['message']=='duplication'){
				email.classList.add('error')
				emailError.classList.add('show')
				emailError.innerHTML = '该电子邮件已被注册'
				setTimeout(function(){
					emailAddress = emailValue
					signInMode()
				},1000)
			}
		})
	}
	lastName.onfocus = function(){
		lastNameError.classList.remove('show')
	}
	fisrtName.onfocus = function(){
		fisrtNameError.classList.remove('show')
	}
	email.onfocus = function(){
		emailError.classList.remove('show')
	}
	password.onfocus = function(){
		passwordError.classList.remove('show')
	}
	form.appendChild(lastNameError)
	form.appendChild(lastName)
	form.appendChild(fisrtNameError)
	form.appendChild(fisrtName)
	form.appendChild(emailError)
	form.appendChild(email)
	form.appendChild(passwordError)
	form.appendChild(password)
	form.appendChild(checkboxError)
	form.appendChild(checkbox)
	form.appendChild(button)
	fragment.appendChild(title)
	fragment.appendChild(modeSwitch)
	fragment.appendChild(form)
	formBlock.innerHTML = ''
	headerSwitch.innerHTML = '登录'
	mode = 0
	formBlock.appendChild(fragment)
	lastName.focus()
}


function signInMode(){
	let fragment = document.createDocumentFragment()
	let title = createElement('div','title')
	title.innerHTML = '登录'
	let modeSwitch = createElement('div','switch')
	modeSwitch.innerHTML = '或'
	let trigger = createElement('div','trigger')
	trigger.onclick = function(){
		signUpMode()
	}
	trigger.innerHTML = '创建账户'
	modeSwitch.appendChild(trigger)
	let form = createElement('form','')
	let email = createElement('input','')
	let emailError = createElement('div','message')
	email.type = 'text'
	email.placeholder = '电子邮件'
	let password = createElement('input','')
	password.type = 'password'
	password.placeholder = '密码'
	let passwordError = createElement('div','message')
	let checkbox = createElement('div','checkbox')
	checkbox.innerHTML = '保存我的信息'
	checkbox.classList.add('check')
	checkbox.onclick = function(){
		if(this.classList.contains('check'))
			this.classList.remove('check')
		else
			this.classList.add('check')
	}
	let button = createElement('button','')
	button.type = 'button'
	button.innerHTML = '登录'
	button.onclick = function(){
		let emailValue = email.value
		let passwordValue = password.value
		let remember = (checkbox.classList.contains('check')) ? true : false
		if(emailValue==''){
			email.classList.add('error')
			emailError.classList.add('show')
			emailError.innerHTML = '请输入您的电子邮件地址'
			return
		}
		else if(!emailFormat.test(emailValue)){
			emailError.classList.add('show')
			emailError.innerHTML = '请输入一个有效的电子邮件地址'
			return
		}
		else if(passwordValue==''){
			password.classList.add('error')
			passwordError.classList.add('show')
			passwordError.innerHTML = '请输入密码'
			return
		}
		let data = `email=${emailValue}&password=${passwordValue}&remember=${remember}`
		request('POST',`${apiHost}/signin`,data)
		.then(function(jsonBack){
			if(jsonBack['code'] == 200){
				//
			}
			else{
				email.classList.add('error')
				emailError.classList.add('show')
				emailError.innerHTML = '电子邮件或密码无效'
			}
		})
	}
	email.onfocus = function(){
		email.classList.remove('error')
		emailError.classList.remove('show')
	}
	password.onfocus = function(){
		password.classList.remove('error')
		passwordError.classList.remove('show')
	}
	form.appendChild(emailError)
	form.appendChild(email)
	form.appendChild(passwordError)
	form.appendChild(password)
	form.appendChild(checkbox)
	form.appendChild(button)
	fragment.appendChild(title)
	fragment.appendChild(modeSwitch)
	fragment.appendChild(form)
	formBlock.innerHTML = ''
	headerSwitch.innerHTML = '注册'
	mode = 1
	formBlock.appendChild(fragment)
	if(emailAddress){
		email.value = emailAddress
		password.focus()
	}
	else{
		email.focus()
	}
}

headerSwitch.onclick = function(){
	if(mode)
		signUpMode()
	else
		signInMode()
	mode = mode++%2
}

window.onload = function(){
	signUpMode()
}


