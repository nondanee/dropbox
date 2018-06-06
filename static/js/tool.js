const apiHost = ''

function timeReadable(date){
	date = new Date(date)
	let year = date.getFullYear()
	let month = date.getMonth() + 1
	let day = date.getDate()
	let hour = (date.getHours() > 12) ? date.getHours() % 12 : date.getHours()
	let minute = date.getMinutes()

	month = (month < 10) ? "0" + month.toString() : month.toString()
	day = (day < 10) ? "0" + day.toString() : day.toString()
	minute = (minute < 10) ? "0" + minute.toString() : minute.toString()
	let half = (date.getHours() > 12) ? "下午" : "上午"
	
	return `${year}-${month}-${day} ${half}${hour}:${minute}`
}

function dateReadable(date){
	date = new Date(date)
	let year = date.getFullYear()
	let month = date.getMonth() + 1
	let day = date.getDate()

	return `${year}年${month}月${day}日`
}

function mimeReadable(mime,status){
	const dict = {
		"image/jpeg": "图像",
		"audio/mpeg": "音频",
		"video/mp4": "视频",
		"directory": "文件夹",
	}
	let typeText = (dict[mime]) ? dict[mime] : "文件"
	return (status == 1) ? typeText : `已删除${typeText}`
}

function sizeReadable(size){
	if(size == null){
		return ''
	}
	unit = 0
	while(true){
		if(size < 1024){
			break
		}
		size = size/1024
		unit += 1
	}
	sizeFixed = size.toFixed(2)
	size = (sizeFixed == size) ? size : sizeFixed
	return size + ' ' + ['字节','KB','MB','GB','TB'][unit]

}

function iconDetect(mime,large=false){

	
	const dictSmall = {
		"application/msword": '<svg width="40" height="40" viewBox="0 0 40 40"><defs><rect id="mc-content-docx-small-b" x="8" y="5" width="24" height="30" rx="1.5"></rect><filter x="-2.1%" y="-1.7%" width="104.2%" height="106.7%" filterUnits="objectBoundingBox" id="mc-content-docx-small-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-docx-small-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-docx-small-b"></use><use fill="#f9f9f9" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-docx-small-b"></use></g><path d="M13 15.505a.5.5 0 0 1 .498-.505h13.004c.275 0 .498.214.498.505v.99a.5.5 0 0 1-.498.505H13.498a.494.494 0 0 1-.498-.505v-.99zm0 4a.5.5 0 0 1 .498-.505h13.004c.275 0 .498.214.498.505v.99a.5.5 0 0 1-.498.505H13.498a.494.494 0 0 1-.498-.505v-.99zm0 4c0-.279.228-.505.51-.505h8.98a.5.5 0 0 1 .51.505v.99a.507.507 0 0 1-.51.505h-8.98a.5.5 0 0 1-.51-.505v-.99z" fill="#3BA0F3"></path></g></svg>',
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": '<svg width="40" height="40" viewBox="0 0 40 40"><defs><rect id="mc-content-docx-small-b" x="8" y="5" width="24" height="30" rx="1.5"></rect><filter x="-2.1%" y="-1.7%" width="104.2%" height="106.7%" filterUnits="objectBoundingBox" id="mc-content-docx-small-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-docx-small-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-docx-small-b"></use><use fill="#f9f9f9" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-docx-small-b"></use></g><path d="M13 15.505a.5.5 0 0 1 .498-.505h13.004c.275 0 .498.214.498.505v.99a.5.5 0 0 1-.498.505H13.498a.494.494 0 0 1-.498-.505v-.99zm0 4a.5.5 0 0 1 .498-.505h13.004c.275 0 .498.214.498.505v.99a.5.5 0 0 1-.498.505H13.498a.494.494 0 0 1-.498-.505v-.99zm0 4c0-.279.228-.505.51-.505h8.98a.5.5 0 0 1 .51.505v.99a.507.507 0 0 1-.51.505h-8.98a.5.5 0 0 1-.51-.505v-.99z" fill="#3BA0F3"></path></g></svg>',
		"application/vnd.ms-excel": '<svg width="40" height="40" viewBox="0 0 40 40"><defs><rect id="mc-content-xls-small-b" x="8" y="5" width="24" height="30" rx="1.5"></rect><filter x="-2.1%" y="-1.7%" width="104.2%" height="106.7%" filterUnits="objectBoundingBox" id="mc-content-xls-small-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter><rect id="mc-content-xls-small-d" x="8" y="5" width="24" height="30" rx="1.5"></rect><filter x="-2.1%" y="-1.7%" width="104.2%" height="106.7%" filterUnits="objectBoundingBox" id="mc-content-xls-small-c"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-xls-small-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-xls-small-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-xls-small-b"></use></g><g><use fill="#000" filter="url(#mc-content-xls-small-c)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-xls-small-d"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-xls-small-d"></use></g><path d="M13 23.495a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm0-4a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm0-4a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm5 8a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm5 0a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm-5-4a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm5 0a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm-5-4a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm5 0a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01z" fill="#42C25F"></path></g></svg>',
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": '<svg width="40" height="40" viewBox="0 0 40 40"><defs><rect id="mc-content-xls-small-b" x="8" y="5" width="24" height="30" rx="1.5"></rect><filter x="-2.1%" y="-1.7%" width="104.2%" height="106.7%" filterUnits="objectBoundingBox" id="mc-content-xls-small-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter><rect id="mc-content-xls-small-d" x="8" y="5" width="24" height="30" rx="1.5"></rect><filter x="-2.1%" y="-1.7%" width="104.2%" height="106.7%" filterUnits="objectBoundingBox" id="mc-content-xls-small-c"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-xls-small-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-xls-small-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-xls-small-b"></use></g><g><use fill="#000" filter="url(#mc-content-xls-small-c)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-xls-small-d"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-xls-small-d"></use></g><path d="M13 23.495a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm0-4a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm0-4a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm5 8a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm5 0a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm-5-4a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm5 0a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm-5-4a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01zm5 0a.49.49 0 0 1 .49-.495h3.02c.27 0 .49.216.49.495v2.01a.49.49 0 0 1-.49.495h-3.02a.49.49 0 0 1-.49-.495v-2.01z" fill="#42C25F"></path></g></svg>',
		"application/vnd.ms-powerpoint": '<svg width="40" height="40" viewBox="0 0 40 40"><defs><rect id="mc-content-ppt-small-b" width="30" height="24" rx="1.5"></rect><filter x="-1.7%" y="-2.1%" width="103.3%" height="108.3%" filterUnits="objectBoundingBox" id="mc-content-ppt-small-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g transform="translate(5 8)"><use fill="#000" filter="url(#mc-content-ppt-small-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-ppt-small-b"></use><use fill="#f9f9f9" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-ppt-small-b"></use></g><path d="M20 15.491a.463.463 0 0 0-.496-.462s-.174-.001-.497.053A6.002 6.002 0 0 0 20 27a6.002 6.002 0 0 0 5.917-4.999c.055-.325.053-.501.053-.501a.466.466 0 0 0-.461-.5h-5.018a.496.496 0 0 1-.491-.491v-5.018z" fill="#F25123"></path><path d="M22 18.509c0 .271.228.491.491.491h5.018c.271 0 .476-.22.456-.499 0 0-.031-.446-.036-.478-.495-3.09-3.11-4.69-4.909-4.926-.096-.013-.523-.051-.523-.051a.447.447 0 0 0-.497.445v5.018z" fill="#F25123"></path></g></svg>',
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": '<svg width="40" height="40" viewBox="0 0 40 40"><defs><rect id="mc-content-ppt-small-b" width="30" height="24" rx="1.5"></rect><filter x="-1.7%" y="-2.1%" width="103.3%" height="108.3%" filterUnits="objectBoundingBox" id="mc-content-ppt-small-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g transform="translate(5 8)"><use fill="#000" filter="url(#mc-content-ppt-small-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-ppt-small-b"></use><use fill="#f9f9f9" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-ppt-small-b"></use></g><path d="M20 15.491a.463.463 0 0 0-.496-.462s-.174-.001-.497.053A6.002 6.002 0 0 0 20 27a6.002 6.002 0 0 0 5.917-4.999c.055-.325.053-.501.053-.501a.466.466 0 0 0-.461-.5h-5.018a.496.496 0 0 1-.491-.491v-5.018z" fill="#F25123"></path><path d="M22 18.509c0 .271.228.491.491.491h5.018c.271 0 .476-.22.456-.499 0 0-.031-.446-.036-.478-.495-3.09-3.11-4.69-4.909-4.926-.096-.013-.523-.051-.523-.051a.447.447 0 0 0-.497.445v5.018z" fill="#F25123"></path></g></svg>',
		"audio/mpeg": '<svg width="40" height="40" viewBox="0 0 40 40"><defs><rect id="mc-content-audio-small-b" width="30" height="24" rx="1.5"></rect><filter x="-1.7%" y="-2.1%" width="103.3%" height="108.3%" filterUnits="objectBoundingBox" id="mc-content-audio-small-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g transform="translate(5 8)"><use fill="#000" filter="url(#mc-content-audio-small-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-small-b"></use><use fill="#f9f9f9" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-small-b"></use></g><path d="M13 19.01a1 1 0 1 1 2 0v1.98a1 1 0 1 1-2 0v-1.98zm12 0a1 1 0 1 1 2 0v1.98a1 1 0 1 1-2 0v-1.98zm-9-5.003c0-.556.444-1.007 1-1.007.552 0 1 .45 1 1.007v11.986C18 26.55 17.556 27 17 27c-.552 0-1-.45-1-1.007V14.007zm6 2.99c0-.55.444-.997 1-.997.552 0 1 .453 1 .997v6.006c0 .55-.444.997-1 .997-.552 0-1-.453-1-.997v-6.006zm-3 .994c0-.547.444-.991 1-.991a1 1 0 0 1 1 .99v4.02c0 .546-.444.99-1 .99a1 1 0 0 1-1-.99v-4.02z" fill="#6f6f6f"></path></g></svg>',
		"audio/mp3": '<svg width="40" height="40" viewBox="0 0 40 40"><defs><rect id="mc-content-audio-small-b" width="30" height="24" rx="1.5"></rect><filter x="-1.7%" y="-2.1%" width="103.3%" height="108.3%" filterUnits="objectBoundingBox" id="mc-content-audio-small-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g transform="translate(5 8)"><use fill="#000" filter="url(#mc-content-audio-small-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-small-b"></use><use fill="#f9f9f9" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-small-b"></use></g><path d="M13 19.01a1 1 0 1 1 2 0v1.98a1 1 0 1 1-2 0v-1.98zm12 0a1 1 0 1 1 2 0v1.98a1 1 0 1 1-2 0v-1.98zm-9-5.003c0-.556.444-1.007 1-1.007.552 0 1 .45 1 1.007v11.986C18 26.55 17.556 27 17 27c-.552 0-1-.45-1-1.007V14.007zm6 2.99c0-.55.444-.997 1-.997.552 0 1 .453 1 .997v6.006c0 .55-.444.997-1 .997-.552 0-1-.453-1-.997v-6.006zm-3 .994c0-.547.444-.991 1-.991a1 1 0 0 1 1 .99v4.02c0 .546-.444.99-1 .99a1 1 0 0 1-1-.99v-4.02z" fill="#6f6f6f"></path></g></svg>',
		"video/mp4": '<svg width="40" height="40" viewBox="0 0 40 40"><defs><rect id="mc-content-video-small-b" width="30" height="24" rx="1.5"></rect><filter x="-1.7%" y="-2.1%" width="103.3%" height="108.3%" filterUnits="objectBoundingBox" id="mc-content-video-small-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g transform="translate(5 8)"><use fill="#000" filter="url(#mc-content-video-small-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-video-small-b"></use><use fill="#f9f9f9" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-video-small-b"></use></g><path d="M16 15.51c0-.282.209-.406.456-.282l9.088 4.544c.252.126.247.332 0 .456l-9.088 4.544c-.252.126-.456 0-.456-.282v-8.98z" fill="#6f6f6f"></path></g></svg>',
		"image/jpeg": '<svg width="40" height="40" viewBox="0 0 40 40"><defs><rect id="mc-content-image-small-b" x="8" y="8" width="24" height="24" rx="1.5"></rect><filter x="-2.1%" y="-2.1%" width="104.2%" height="108.3%" filterUnits="objectBoundingBox" id="mc-content-image-small-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-image-small-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-image-small-b"></use><use fill="#f9f9f9" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-image-small-b"></use></g><path d="M17.399 19.386c.174-.213.457-.207.622 0l3.65 4.593c.17.213.446.223.635.002l1.937-2.264c.181-.212.459-.206.62.014l2.845 3.871c.161.22.066.398-.204.398H12.496c-.274 0-.355-.173-.18-.386l5.083-6.228zM23.5 18a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5z" fill="#6f6f6f"></path></g></svg>',
		"application/pdf": '<svg width="40" height="40" viewBox="0 0 40 40"><defs><rect id="mc-content-pdf-small-b" x="8" y="5" width="24" height="30" rx="1.5"></rect><filter x="-2.1%" y="-1.7%" width="104.2%" height="106.7%" filterUnits="objectBoundingBox" id="mc-content-pdf-small-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter><rect id="mc-content-pdf-small-d" x="5" y="2" width="24" height="30" rx="1.5"></rect><filter x="-2.1%" y="-1.7%" width="104.2%" height="106.7%" filterUnits="objectBoundingBox" id="mc-content-pdf-small-c"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-pdf-small-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-pdf-small-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-pdf-small-b"></use></g><g transform="translate(3 3)"><use fill="#000" filter="url(#mc-content-pdf-small-c)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-pdf-small-d"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-pdf-small-d"></use></g><g stroke="#F25123" stroke-width="1.5"><path d="M20 17.5l2.701 4.678h-5.402L20 17.5zM19.998 17.33l1.017-1.762c.86-1.49.443-2.553-1.017-2.775-1.459.222-1.878 1.284-1.017 2.775l1.017 1.762zM26.494 24.528c.54-1.38-.174-2.278-1.902-2.278h-2.043l1.022 1.77c.863 1.495 1.998 1.665 2.923.508zM13.386 24.528c-.54-1.38.174-2.278 1.903-2.278h2.044l-1.022 1.77c-.864 1.496-2 1.666-2.925.508z"></path></g></g></svg>',

		"directory": '<svg width="40" height="40" viewBox="0 0 40 40"><g fill="none" fill-rule="evenodd"><path d="M18.422 11h15.07c.84 0 1.508.669 1.508 1.493v18.014c0 .818-.675 1.493-1.508 1.493H6.508C5.668 32 5 31.331 5 30.507V9.493C5 8.663 5.671 8 6.5 8h7.805c.564 0 1.229.387 1.502.865l1.015 1.777s.4.358 1.6.358z" fill="#966eb3"></path><path d="M18.422 10h15.07c.84 0 1.508.669 1.508 1.493v18.014c0 .818-.675 1.493-1.508 1.493H6.508C5.668 31 5 30.331 5 29.507V8.493C5 7.663 5.671 7 6.5 7h7.805c.564 0 1.229.387 1.502.865l1.015 1.777s.4.358 1.6.358z" fill="#b68fd3"></path></g></svg>',
	}

	const dictLarge = {
		"application/msword": '<svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content"><title>content-docx-large</title><defs><rect id="mc-content-docx-large-b" x="43" y="30" width="74" height="100" rx="4"></rect><filter x="-.7%" y="-.5%" width="101.4%" height="102%" filterUnits="objectBoundingBox" id="mc-content-docx-large-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g transform="translate(3)"><use fill="#000" filter="url(#mc-content-docx-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-docx-large-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-docx-large-b"></use></g><path d="M60 63.99c0-.546.455-.99 1.004-.99h43.992c.555 0 1.004.451 1.004.99v4.02c0 .546-.455.99-1.004.99H61.004A1.002 1.002 0 0 1 60 68.01v-4.02zm0 14c0-.546.455-.99 1.004-.99h43.992c.555 0 1.004.451 1.004.99v4.02c0 .546-.455.99-1.004.99H61.004A1.002 1.002 0 0 1 60 82.01v-4.02zm0 14c0-.546.447-.99.998-.99h28.004a1 1 0 0 1 .998.99v4.02c0 .546-.447.99-.998.99H60.998a1 1 0 0 1-.998-.99v-4.02z" fill="#3BA0F3"></path></g></svg>',
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document": '<svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content"><title>content-docx-large</title><defs><rect id="mc-content-docx-large-b" x="43" y="30" width="74" height="100" rx="4"></rect><filter x="-.7%" y="-.5%" width="101.4%" height="102%" filterUnits="objectBoundingBox" id="mc-content-docx-large-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g transform="translate(3)"><use fill="#000" filter="url(#mc-content-docx-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-docx-large-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-docx-large-b"></use></g><path d="M60 63.99c0-.546.455-.99 1.004-.99h43.992c.555 0 1.004.451 1.004.99v4.02c0 .546-.455.99-1.004.99H61.004A1.002 1.002 0 0 1 60 68.01v-4.02zm0 14c0-.546.455-.99 1.004-.99h43.992c.555 0 1.004.451 1.004.99v4.02c0 .546-.455.99-1.004.99H61.004A1.002 1.002 0 0 1 60 82.01v-4.02zm0 14c0-.546.447-.99.998-.99h28.004a1 1 0 0 1 .998.99v4.02c0 .546-.447.99-.998.99H60.998a1 1 0 0 1-.998-.99v-4.02z" fill="#3BA0F3"></path></g></svg>',
		"application/vnd.ms-excel": '<svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content"><defs><rect id="mc-content-xls-large-b" x="43" y="30" width="74" height="100" rx="4"></rect><filter x="-.7%" y="-.5%" width="101.4%" height="102%" filterUnits="objectBoundingBox" id="mc-content-xls-large-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-xls-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-xls-large-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-xls-large-b"></use></g><path d="M56 63.995A1 1 0 0 1 57.007 63h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H57.007A1.008 1.008 0 0 1 56 72.005v-8.01zm17 0A1 1 0 0 1 74.007 63h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H74.007A1.008 1.008 0 0 1 73 72.005v-8.01zm17 0A1 1 0 0 1 91.007 63h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H91.007A1.008 1.008 0 0 1 90 72.005v-8.01zm-34 13A1 1 0 0 1 57.007 76h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H57.007A1.008 1.008 0 0 1 56 85.005v-8.01zm17 0A1 1 0 0 1 74.007 76h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H74.007A1.008 1.008 0 0 1 73 85.005v-8.01zm17 0A1 1 0 0 1 91.007 76h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H91.007A1.008 1.008 0 0 1 90 85.005v-8.01zm-34 13A1 1 0 0 1 57.007 89h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H57.007A1.008 1.008 0 0 1 56 98.005v-8.01zm17 0A1 1 0 0 1 74.007 89h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H74.007A1.008 1.008 0 0 1 73 98.005v-8.01zm17 0A1 1 0 0 1 91.007 89h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H91.007A1.008 1.008 0 0 1 90 98.005v-8.01z" fill="#3DCC5E"></path></g></svg>',
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": '<svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content"><defs><rect id="mc-content-xls-large-b" x="43" y="30" width="74" height="100" rx="4"></rect><filter x="-.7%" y="-.5%" width="101.4%" height="102%" filterUnits="objectBoundingBox" id="mc-content-xls-large-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-xls-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-xls-large-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-xls-large-b"></use></g><path d="M56 63.995A1 1 0 0 1 57.007 63h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H57.007A1.008 1.008 0 0 1 56 72.005v-8.01zm17 0A1 1 0 0 1 74.007 63h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H74.007A1.008 1.008 0 0 1 73 72.005v-8.01zm17 0A1 1 0 0 1 91.007 63h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H91.007A1.008 1.008 0 0 1 90 72.005v-8.01zm-34 13A1 1 0 0 1 57.007 76h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H57.007A1.008 1.008 0 0 1 56 85.005v-8.01zm17 0A1 1 0 0 1 74.007 76h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H74.007A1.008 1.008 0 0 1 73 85.005v-8.01zm17 0A1 1 0 0 1 91.007 76h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H91.007A1.008 1.008 0 0 1 90 85.005v-8.01zm-34 13A1 1 0 0 1 57.007 89h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H57.007A1.008 1.008 0 0 1 56 98.005v-8.01zm17 0A1 1 0 0 1 74.007 89h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H74.007A1.008 1.008 0 0 1 73 98.005v-8.01zm17 0A1 1 0 0 1 91.007 89h11.986c.556 0 1.007.456 1.007.995v8.01a1 1 0 0 1-1.007.995H91.007A1.008 1.008 0 0 1 90 98.005v-8.01z" fill="#3DCC5E"></path></g></svg>',
		"application/vnd.ms-powerpoint": '<svg width="160" height="160" viewBox="0 0 160 160"><title>content-ppt-large</title><defs><rect id="mc-content-ppt-large-b" x="30" y="43" width="100" height="74" rx="4"></rect><filter x="-.5%" y="-.7%" width="101%" height="102.7%" filterUnits="objectBoundingBox" id="mc-content-ppt-large-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-ppt-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-ppt-large-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-ppt-large-b"></use></g><path d="M80 65a.966.966 0 0 0-.997-.97C70.631 64.546 64 71.499 64 80c0 8.837 7.163 16 16 16 8.497 0 15.447-6.623 15.969-14.988V81a.962.962 0 0 0-.97-1H81.001C80.448 80 80 79.555 80 79V65z" fill="#F25123"></path><path d="M84 75c0 .552.445 1 1 1h14a.963.963 0 0 0 .97-.991s.02.328 0 0c-.492-8.038-6.916-14.472-14.95-14.977l-.016-.001a.964.964 0 0 0-1.004.97v13.998z" fill="#F25123"></path></g></svg>',
		"application/vnd.openxmlformats-officedocument.presentationml.presentation": '<svg width="160" height="160" viewBox="0 0 160 160"><title>content-ppt-large</title><defs><rect id="mc-content-ppt-large-b" x="30" y="43" width="100" height="74" rx="4"></rect><filter x="-.5%" y="-.7%" width="101%" height="102.7%" filterUnits="objectBoundingBox" id="mc-content-ppt-large-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-ppt-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-ppt-large-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-ppt-large-b"></use></g><path d="M80 65a.966.966 0 0 0-.997-.97C70.631 64.546 64 71.499 64 80c0 8.837 7.163 16 16 16 8.497 0 15.447-6.623 15.969-14.988V81a.962.962 0 0 0-.97-1H81.001C80.448 80 80 79.555 80 79V65z" fill="#F25123"></path><path d="M84 75c0 .552.445 1 1 1h14a.963.963 0 0 0 .97-.991s.02.328 0 0c-.492-8.038-6.916-14.472-14.95-14.977l-.016-.001a.964.964 0 0 0-1.004.97v13.998z" fill="#F25123"></path></g></svg>',
		"audio/mpeg": '<svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content"><title>content-audio-large</title><defs><rect id="mc-content-audio-large-b" x="30" y="43" width="100" height="74" rx="4"></rect><filter x="-.5%" y="-.7%" width="101%" height="102.7%" filterUnits="objectBoundingBox" id="mc-content-audio-large-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-audio-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-large-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-large-b"></use></g><path d="M67 60c0-1.657 1.347-3 3-3 1.657 0 3 1.352 3 3v40c0 1.657-1.347 3-3 3-1.657 0-3-1.352-3-3V60zM57 78c0-1.657 1.347-3 3-3 1.657 0 3 1.349 3 3v4c0 1.657-1.347 3-3 3-1.657 0-3-1.349-3-3v-4zm40 0c0-1.657 1.347-3 3-3 1.657 0 3 1.349 3 3v4c0 1.657-1.347 3-3 3-1.657 0-3-1.349-3-3v-4zm-20-5.006A3 3 0 0 1 80 70c1.657 0 3 1.343 3 2.994v14.012A3 3 0 0 1 80 90c-1.657 0-3-1.343-3-2.994V72.994zM87 68c0-1.657 1.347-3 3-3 1.657 0 3 1.347 3 3v24c0 1.657-1.347 3-3 3-1.657 0-3-1.347-3-3V68z" fill="#637282"></path></g></svg>',
		"audio/mp3": '<svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content"><title>content-audio-large</title><defs><rect id="mc-content-audio-large-b" x="30" y="43" width="100" height="74" rx="4"></rect><filter x="-.5%" y="-.7%" width="101%" height="102.7%" filterUnits="objectBoundingBox" id="mc-content-audio-large-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-audio-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-large-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-audio-large-b"></use></g><path d="M67 60c0-1.657 1.347-3 3-3 1.657 0 3 1.352 3 3v40c0 1.657-1.347 3-3 3-1.657 0-3-1.352-3-3V60zM57 78c0-1.657 1.347-3 3-3 1.657 0 3 1.349 3 3v4c0 1.657-1.347 3-3 3-1.657 0-3-1.349-3-3v-4zm40 0c0-1.657 1.347-3 3-3 1.657 0 3 1.349 3 3v4c0 1.657-1.347 3-3 3-1.657 0-3-1.349-3-3v-4zm-20-5.006A3 3 0 0 1 80 70c1.657 0 3 1.343 3 2.994v14.012A3 3 0 0 1 80 90c-1.657 0-3-1.343-3-2.994V72.994zM87 68c0-1.657 1.347-3 3-3 1.657 0 3 1.347 3 3v24c0 1.657-1.347 3-3 3-1.657 0-3-1.347-3-3V68z" fill="#637282"></path></g></svg>',
		"video/mp4": '<svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content"><defs><rect id="mc-content-video-large-b" x="30" y="43" width="100" height="74" rx="4"></rect><filter x="-.5%" y="-.7%" width="101%" height="102.7%" filterUnits="objectBoundingBox" id="mc-content-video-large-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-video-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-video-large-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-video-large-b"></use></g><path d="M69 67.991c0-1.1.808-1.587 1.794-1.094l24.412 12.206c.99.495.986 1.3 0 1.794L70.794 93.103c-.99.495-1.794-.003-1.794-1.094V67.99z" fill="#637282"></path></g></svg>',
		"image/jpeg": '<svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content"><title>content-image-large</title><defs><rect id="mc-content-image-large-b" x="43" y="43" width="74" height="74" rx="4"></rect><filter x="-.7%" y="-.7%" width="101.4%" height="102.7%" filterUnits="objectBoundingBox" id="mc-content-image-large-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g transform="translate(0 -1)"><use fill="#000" filter="url(#mc-content-image-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-image-large-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-image-large-b"></use></g><path d="M73.51 80.3c.351-.423.917-.42 1.27.015l9.633 11.877c.35.43.927.444 1.294.025l5.312-6.082c.365-.418.932-.394 1.263.047l7.561 10.082c.333.444.157.803-.388.803H60.527c-.547 0-.7-.35-.354-.764l13.336-16.004zM92 78a6 6 0 1 1 0-12 6 6 0 0 1 0 12z" fill="#637282"></path></g></svg>',
		"application/pdf": '<svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content"><defs><rect id="mc-content-pdf-large-b" x="43" y="30" width="74" height="100" rx="4"></rect><filter x="-.7%" y="-.5%" width="101.4%" height="102%" filterUnits="objectBoundingBox" id="mc-content-pdf-large-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-pdf-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-pdf-large-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-pdf-large-b"></use></g><g stroke="#F25123" stroke-width="5"><path d="M80 74.5l7.17 12.419H72.83L80 74.5zM79.995 72.637l3.171-5.494c2.237-3.875 1.003-6.39-3.171-6.625-4.175.236-5.41 2.75-3.172 6.625l3.172 5.494zM98.465 93.898c1.905-3.748.348-6.085-4.137-6.085h-6.404l3.202 5.546c2.242 3.884 5.045 4.063 7.34.54zM61.19 93.901c-1.905-3.75-.347-6.088 4.139-6.088h6.407l-3.204 5.548c-2.243 3.886-5.047 4.065-7.342.54z"></path></g></g></svg>',

	}

	if(!large)
		return (dictSmall[mime]) ? dictSmall[mime] : '<svg width="40" height="40" viewBox="0 0 40 40" ><defs><rect id="mc-content-unknown-small-b" x="8" y="5" width="24" height="30" rx="1.5"></rect><filter x="-2.1%" y="-1.7%" width="104.2%" height="106.7%" filterUnits="objectBoundingBox" id="mc-content-unknown-small-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858859196 0 0 0 0 0.871765907 0 0 0 0 0.884672619 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-unknown-small-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-unknown-small-b"></use><use fill="#f9f9f9" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-unknown-small-b"></use><rect fill="#D8D8D8" x="16" y="26" width="8" height="1" rx=".5"></rect><g><path d="M17 22h6v-3a3 3 0 1 0-6 0v3z" stroke="#6f6f6f"></path><path d="M14.64 20.36c.751-.751 2.227-1.36 3.275-1.36h4.176c1.054 0 2.516.607 3.269 1.36l.929.929c.393.393.273.774-.277.852l-4.118.588c-1.046.15-2.752.148-3.788 0l-4.118-.588c-.546-.078-.667-.462-.277-.852l.93-.93z" fill="#6f6f6f"></path></g></g></g></svg>'

	else
		return (dictLarge[mime]) ? dictLarge[mime] : '<svg width="160" height="160" viewBox="0 0 160 160" class="mc-icon-template-content"><title>content-unknown-large</title><defs><rect id="mc-content-unknown-large-b" x="43" y="30" width="74" height="100" rx="4"></rect><filter x="-.7%" y="-.5%" width="101.4%" height="102%" filterUnits="objectBoundingBox" id="mc-content-unknown-large-a"><feOffset dy="1" in="SourceAlpha" result="shadowOffsetOuter1"></feOffset><feColorMatrix values="0 0 0 0 0.858823529 0 0 0 0 0.870588235 0 0 0 0 0.88627451 0 0 0 1 0" in="shadowOffsetOuter1"></feColorMatrix></filter></defs><g fill="none" fill-rule="evenodd"><g><use fill="#000" filter="url(#mc-content-unknown-large-a)" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-unknown-large-b"></use><use fill="#F7F9FA" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#mc-content-unknown-large-b"></use><rect fill="#D8D8D8" x="67.643" y="94.143" width="25.714" height="3.214" rx="1.607"></rect><path d="M69.357 82.786V71.643c0-6.154 4.989-11.143 11.143-11.143 6.154 0 11.143 4.989 11.143 11.143v11.143H69.357zm3-3h16.286v-8.143a8.143 8.143 0 1 0-16.286 0v8.143z" fill="#637282" fill-rule="nonzero"></path><path d="M66.23 73.055c.78-.78 2.316-1.412 3.42-1.412h21.71c1.103 0 2.63.633 3.41 1.412l6.818 6.818c.78.78.53 1.539-.565 1.695l-14.42 2.06c-3.37.482-8.84.481-12.207 0l-14.419-2.06c-1.092-.156-1.344-.915-.565-1.695l6.818-6.818z" fill="#637282"></path></g></g></svg>'


}

function createElement(tagName,className){
	let element = document.createElement(tagName)
	if(className) element.className = className 
	return element
}

function sortBy(attribute,reverse){
	if(reverse == undefined){
		reverse = 1
	}
	else{
		reverse = (reverse) ? 1 : -1
	}
	return function(front,back){
		if(attribute == 'type'){
			front = mimeReadable(front.type,front.status)
			back = mimeReadable(back.type,back.status)
		}
		else{
			front = front[attribute]
			back = back[attribute]			
		}
		if(front < back){
			return reverse * -1
		}
		else if(front > back){
			return reverse * 1
		}
		return 0
	}
}

function illegalName(name){
	let checker = new RegExp(/[\\|\/|:|*|?|"|<|>|\|]/)
	return checker.test(name)
}

function request(method,url,data){
	let form = []
	for (let key in data)
		form.push(`${key}=${encodeURIComponent(data[key])}`)
	form = form.join('&')
	return new Promise(function (resolve, reject){
		let xhr = new XMLHttpRequest()
		xhr.onreadystatechange = function(){
			if(xhr.readyState == 4){
				if(xhr.status == 200){
					let jsonBack = JSON.parse(xhr.responseText)
					resolve(jsonBack)
				}
				else{
					reject()
				}
			}
		}
		xhr.open(method,url)
		if(method.toLocaleUpperCase() == 'POST'){
			xhr.setRequestHeader('Content-Type','application/x-www-form-urlencoded')
			xhr.send(form)
		}
		else{
			xhr.send()
		}
	})
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

function notify(message,type){
	let notifyBanner = document.getElementsByClassName('notify')[0]
	let messageBox = createElement('div','message')
	messageBox.classList.add(type)
	messageBox.innerHTML = message
	notifyBanner.innerHTML = ''
	notifyBanner.appendChild(messageBox)
}

function errorReadable(error){
	const dict = {
		'name illegal': "文件名不合法。",
		'already exists': "目录已存在。",
		'file exists': "存在同名文件。",
		'directory exists': "存在同名目录。",
		'something wrong': "无法完成此项请求。",
		'empty': "没有文件可以打包。"
	}

	return (dict[error]) ? dict[error] : '未知错误。'
}