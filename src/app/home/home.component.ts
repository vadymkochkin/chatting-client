import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Socket } from 'ngx-socket-io';
import * as $ from 'jquery';
import Giphy from 'giphy-api';
import { ApiService } from '../api.service';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import {
	HttpClient, HttpRequest, HttpResponse, HttpEvent
  } from "@angular/common/http";
import { UploadEvent, UploadFile, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';
import { CropperSettings } from 'ng2-img-cropper';

declare const microlink;

const defaultAvatar = 'assets/images/users/user.png';

@Component({
	selector: 'app-home',
	templateUrl: './home.component.html',
	styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

	@ViewChild('messagelist') d1: ElementRef;

	data: any;
	cropperSettings: CropperSettings;

	constructor(public HttpClient:HttpClient, public elementRef: ElementRef, public socket: Socket, private apiService: ApiService, private sanitizer: DomSanitizer) {
		this.cropperSettings = new CropperSettings();
		this.cropperSettings.width = 100;
		this.cropperSettings.height = 100;
		this.cropperSettings.croppedWidth = 100;
		this.cropperSettings.croppedHeight = 100;
		this.cropperSettings.canvasWidth = 400;
		this.cropperSettings.canvasHeight = 300;

		this.data = {};
	}

	username = sessionStorage.getItem('user_name');
	useremail = sessionStorage.getItem('user_email');
	useravatar = sessionStorage.getItem('user_avatar') ? sessionStorage.getItem('user_avatar') : defaultAvatar;
	callingUserAvatar = defaultAvatar;
	callingUser = '';

	message: any = '';
	mob_message: any = '';
	showEmoji: boolean = false;
	editMessage: boolean = false;

	showGiphySearch = false;
	giphySearchTerm = '';
	giphyResults = [];

	selectedUserId = '';
	selectedAvatarUrl = '';
	selectedUserName = '';
	userId = sessionStorage.getItem('user_id');

	messages = [];

	contactsData = [];

	ngOnInit() {
		let obj = this;
		this.data.image = this.useravatar;
		this.apiService.getDataById({ url: "contacts", id: obj.userId }).subscribe((res: any) => {
			obj.contactsData = res;
			obj.socket.emit('userPresence', {
				username: obj.userId
			});
		});
		obj.socket.on('connect', function (data) {
			console.log('Conected Client');
			// To subscribe the socket to a given channel
			obj.socket.emit('join', {
				username: obj.userId
			});
			obj.socket.emit('userPresence', {
				username: obj.userId
			});
		});

		obj.socket.emit('userPresence', {
			username: obj.userId
		});
		
		obj.socket.on('delmsg', function (data) {
			$(".messages").find("#" + data.id).remove();
		});

		obj.socket.on('addcontact', function (data) {
			let userInfo: any = data.user_info;
			userInfo.id = data.user_info._id;
			userInfo.avatar_url = data.user_info.avatar_url ? data.user_info.avatar_url : defaultAvatar;
			userInfo.state = 0;
			obj.contactsData.push(userInfo);
		});

		obj.socket.on('deletecontact', function (data) {
			let contindex: any = -1;
			for (var i in obj.contactsData) {
				var contact = obj.contactsData[i];
				if (contact.id == data.id) {
					contindex = i;
					break;
				}
			}
			if (contindex > -1) {
				obj.contactsData = obj.contactsData.splice(contindex, 1);
			}
		});

		obj.socket.on('message', function (data) {
			if (obj.selectedUserId == data.fromUsername) {
				var d1 = obj.elementRef.nativeElement.querySelector('.messages ul');
				d1.insertAdjacentHTML('beforeend', '<li ' + obj.getContentAttr() + ' class="replies"><img ' + obj.getContentAttr() + ' src="' + obj.selectedAvatarUrl + '" alt="" /><p ' + obj.getContentAttr() + '>' + data.data + '</p></li>')
				$(".messages").animate({ scrollTop: 99999999999999 }, "fast");
			} else {
				var badgenum = $("#" + data.fromUsername).find('.badge').text();
				$("#" + data.fromUsername).find('.badge').text(badgenum * 1 + 1);
			}
			obj.socket.emit('userPresence', {
				username: obj.userId
			});
		});

		obj.socket.on('disconnect', function () {
			// To intimate other clients about disconnection from server
			obj.socket.emit('disconnect', {
				username: obj.userId
			});
		});

		obj.socket.on('onlineUsers', function (data) {
			var keys = Object.keys(data);
			var contdata = obj.contactsData;
			if (contdata.length > 0) {
				for (var i in contdata) {
					if (keys.indexOf(contdata[i].id) > -1) {
						contdata[i].status = 'online';
					}
				}
				obj.contactsData = contdata;
			}
		});

		obj.socket.on('calling', function (data) {
			obj.callingUser = data.userId;
			$("#callmodal").animate({"marginRight": '0px'});
		});

		obj.socket.on('refusecall', function() {
			$("#callmodal").animate({"marginRight": '-400px'});
		});

		$(".messages").animate({ scrollTop: $(document).height() }, "fast");

		$("#profile-img").click(function () {
			$("#status-options").toggleClass("active");
		});

		$("#addcontact").click(function () {
			$("#search input").focus();
		});

		$(document).on('mouseover', '.sent', function () {
			$(this).find('.oper').fadeIn('fast');
		});

		$(document).on('mouseleave', '.sent', function () {
			$(this).find('.oper').fadeOut('fast');
		});

		$(document).on("dblclick", ".contact", function () {
			obj.addContact($(this).attr('id'));
		});

		$("#search input").keyup(function (e) {
			if (e.keyCode == 13) {
				var keyval = $(this).val();
				obj.apiService.findContactByAll({ url: 'contacts/findcontact?key=' + keyval }).subscribe((res: any) => {

					for (var i in res) {
						let contact: any = {};
						contact.name = res[i].name;
						contact.id = res[i]._id;
						contact.avatar_url = defaultAvatar;
						contact.status = 'offline';
						contact.lastmessage = '';
						contact.state = 1;
						obj.contactsData.push(contact);
						$("#" + contact.id).find('.status').val('1');
					}
				});
			}
		})

		$(".hideSetting").click(function () {
			$("#myModal").animate({ 'opacity': 0 });
			$("#myModal").hide();
		});

		$(".hideCrop").click(function () {
			$("#cropmodal").animate({ 'opacity': 0 });
			$("#cropmodal").hide();
		})

		$(".expand-button").click(function () {
			$("#profile").toggleClass("expanded");
			$("#contacts").toggleClass("expanded");
		});

		$("#status-options ul li").click(function () {
			$("#profile-img").removeClass();
			$("#status-online").removeClass("active");
			$("#status-away").removeClass("active");
			$("#status-busy").removeClass("active");
			$("#status-offline").removeClass("active");
			$(this).addClass("active");

			if ($("#status-online").hasClass("active")) {
				$("#profile-img").addClass("online");
			} else if ($("#status-away").hasClass("active")) {
				$("#profile-img").addClass("away");
			} else if ($("#status-busy").hasClass("active")) {
				$("#profile-img").addClass("busy");
			} else if ($("#status-offline").hasClass("active")) {
				$("#profile-img").addClass("offline");
			} else {
				$("#profile-img").removeClass();
			};

			$("#status-options").removeClass("active");
		});

		function newMessage() {
			var message = obj.message;
			var mob_message = obj.mob_message;

			if ($.trim(message) == '') {
				return false;
			}
			var d1 = obj.elementRef.nativeElement.querySelector('.messages ul');

			const urlMatches = message.match(/\b(http|https)?:\/\/\S+/gi);

			let linkstring = '';
			if (urlMatches) {
				for (var i in urlMatches) {
					urlMatches[i] = urlMatches[i].replace(/\.$/, "");
					// message = message.replace(urlMatches[i], '<a ' + obj.getContentAttr() + ' href="' + urlMatches[i] + '">' + urlMatches[i] + '</a>');
					linkstring += '<a ' + obj.getContentAttr() + ' href="' + urlMatches[i] + '" class="link-preview">' + urlMatches[i] + '</a>';
				}
			}
			for (var j in obj.emojis) {
				message = message.replace(obj.emojis[j].name, obj.emojis[j].cont.outerHTML);
			}
			$('.contact.active .preview').html('<span>You: </span>' + message);

			d1.insertAdjacentHTML('beforeend', '<li ' + obj.getContentAttr() + ' class="sent"><img ' + obj.getContentAttr() + ' src="' + obj.useravatar + '" alt="" /><p ' + obj.getContentAttr() + '>' + message + linkstring + '</p><span class="oper"><i class="fa fa-edit editmsg""></i> <i class="fa fa-trash delmsg" (click)="delMsg(m._id)"></i></span></li>')
			// $('.message-input input').val(null);
			$(".messages").animate({ scrollTop: 99999999999999 }, "fast");
			obj.emojis = [];
			obj.message = '';

			obj.socket.emit('message', {
				fromUsername: obj.userId,
				toUsername: obj.selectedUserId,
				data: message,
				mob_message: mob_message
			});

			obj.socket.emit('userPresence', {
				username: obj.userId
			});

			$(document).on('mouseover', '.sent', function () {
				$(this).find('.oper').fadeIn('fast');
			});

			$(document).on('mouseleave', '.sent', function () {
				$(this).find('.oper').fadeOut('fast');
			});

		};

		$(document).on('click', '.submit', function () {
			newMessage();
		});

		$(window).on('keydown', function (e) {
			if (e.which == 13) {
				newMessage();
				return false;
			}
		});

		$("#dropcont").css('height', $(".messages").css('height'));
	}

	ngAfterViewChecked() {
		microlink('.link-preview');
	}

	realmessage = '';
	emojis = [];
	addEmoji(event) {
		const { message } = this;
		console.log(event.emoji);
		const text = `${message}${event.emoji.colons}`;
		const mob_text = `${message}${event.emoji.native}`;

		let emojidata = {
			name: event.emoji.colons,
			cont: event.$event.target,
		}
		this.emojis.push(emojidata);

		this.message = text;
		this.mob_message = mob_text;

		$("#message").focus();
		this.showEmoji = false;
	}

	showEmojiPicker() {
		this.showEmoji = !this.showEmoji;
	}

	getContentAttr(): string {
		const attrs = this.elementRef.nativeElement.attributes
		for (let i = 0, l = attrs.length; i < l; i++) {
			if (attrs[i].name.startsWith('_nghost-c')) {
				return `_ngcontent-c${attrs[i].name.substring(9)}`
			}
		}
	}

	searchGiphy() {
		const giphy = Giphy();
		const searchTerm = this.giphySearchTerm;
		giphy.search(searchTerm)
			.then(res => {
				console.log(res);
				this.giphyResults = res.data;
			})
			.catch(console.error);
	}

	sendGif(title, url) {
		// const { currentUser } = this;
		// currentUser.sendMessage({
		//   text: title,
		//   roomId: '<your room id>',
		//   attachment: {
		//     link: url,
		//     type: 'image',
		//   }
		// }).catch(console.error);
		this.showGiphySearch = false;
	}

	toggleGiphySearch() {
		this.showGiphySearch = !this.showGiphySearch;
	}

	selectUser(userId) {
		this.selectedUserId = userId;
		let obj = this;
		this.selectedAvatarUrl = $("#" + userId).find('img:first').attr('src');
		this.selectedUserName = $("#" + userId).find('.name').text();
		var status = $("#" + userId).find('.status').val();
		if (status == 0) {
			$(".acceptpanel").css('display', 'flex');
		} else {
			$(".acceptpanel").css('display', 'none');
		}
		this.apiService.getDataById({ url: "messages", id: userId + '_' + this.userId }).subscribe((res: any) => {
			obj.messages = res;
			$("#" + userId).find('.badge').text('');
			$(".messages").animate({ scrollTop: 99999999999999 }, "slow");
		});
	}

	s_uname = '';
	s_uemail = '';
	s_uaddr = '';
	s_ubirth = '';
	s_uvhnum = '';
	s_upwd = '';

	showSettingModal() {
		let userinfo = JSON.parse(sessionStorage.getItem('user_info'));
		if (userinfo) {
			this.s_uname = userinfo.name;
			this.s_uaddr = userinfo.address;
			this.s_ubirth = userinfo.birthday;
			this.s_uemail = userinfo.email;
			this.s_uvhnum = userinfo.virtual_number;
		}

		$("#myModal").animate({ 'opacity': 1, "backgroundColor": "background-color: rgba(0, 0, 0, 0.6)" });
		$("#myModal").show();
	}

	showCropperModal() {
		$("#cropmodal").animate({ 'opacity': 1, "backgroundColor": "background-color: rgba(0, 0, 0, 0.6)" });
		$("#cropmodal").show();
	}

	addContact(uid) {
		let obj = this;
		this.apiService.createData({ url: "contacts", contact_id: uid, user_id: this.userId }).subscribe((res: any) => {
			if (res.status == 200) {
				let userInfo = JSON.parse(sessionStorage.getItem('user_info'));
				obj.socket.emit('addcontact', { fromUserId: obj.userId, toUserId: uid, user_info: userInfo });
			}
		});
	}

	moveVideoCall() {
		var obj =  this;
		this.socket.emit('calling', { userId: obj.userId, toId: obj.selectedUserId });
		window.location.href = '/#/videocall?user_id=' + this.selectedUserId + '&type=video&icon=' + this.selectedAvatarUrl
	}

	moveVoiceCall() {
		var obj =  this;
		this.socket.emit('calling', { userId: obj.userId, toId: obj.selectedUserId });
		window.location.href = '/#/videocall?user_id=' + this.selectedUserId + '&type=audio&icon=' + this.selectedAvatarUrl
	}

	signOut() {
		sessionStorage.clear();
		window.location.href = '/#/';
	}

	delMsg(mid) {
		let obj = this;
		this.apiService.deleteData({ url: "messages", id: mid }).subscribe((res: any) => {
			this.socket.emit('delmsg', { id: mid, toUsername: obj.selectedUserId });
			if (res.status == 200)
				$("#" + mid).remove();
		});
	}

	decode(text: string): any {
		return this.sanitizer.bypassSecurityTrustHtml(text);
	}

	public files: UploadFile[] = [];
	isDrag: any = false;
	public dropped(event: UploadEvent) {
		this.files = event.files;
		this.isDrag = false;
		for (const droppedFile of event.files) {

			// Is it a file?
			if (droppedFile.fileEntry.isFile) {
				const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
				fileEntry.file((file: File) => {

					// Here you can access the real file
					console.log(droppedFile.relativePath, file);

          /**
          // You could upload it like this:
          const formData = new FormData()
          formData.append('logo', file, relativePath)
 
          // Headers
          const headers = new HttpHeaders({
            'security-token': 'mytoken'
          })
 
          this.http.post('https://mybackend.com/api/upload/sanitize-and-save-logo', formData, { headers: headers, responseType: 'blob' })
          .subscribe(data => {
            // Sanitized logo returned from backend
          })
          **/

				});
			} else {
				// It was a directory (empty directories are added, otherwise only files)
				const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
				console.log(droppedFile.relativePath, fileEntry);
			}
		}
	}

	public fileOver(event) {
		console.log(event);
		this.isDrag = true
		console.log(event);
	}

	public fileLeave(event) {
		this.isDrag = false;
		console.log(event);
	}

	saveAvatar() {
		this.useravatar = this.data.image;
		sessionStorage.setItem('user_avatar', this.useravatar);
		$(".hideCrop").click();
	}

	saveSetting() {
		let data = {
			url: 'users',
			userId: this.userId,
			name: this.s_uname,
			email: this.s_uemail,
			birthday: this.s_ubirth,
			address: this.s_uaddr,
			virtual_number: this.s_uvhnum,
			user_pwd: this.s_upwd,
			avatar_url: this.useravatar
		}
		this.apiService.updateData(data).subscribe((res: any) => {
			if (res.status == 200) {
				let user_info = JSON.parse(sessionStorage.getItem('user_info'));
				user_info.name = this.s_uname;
				user_info.email = this.s_uemail;
				user_info.birthday = this.s_ubirth;
				user_info.address = this.s_uaddr;
				user_info.virtual_number = this.s_uvhnum;
				user_info.avatar_url = this.useravatar;
				sessionStorage.setItem('user_info', JSON.stringify(user_info));
			}
		});
	}

	acceptRequest() {
		let data = {
			url: 'contacts/accept',
			userId: this.userId,
			contact_id: this.selectedUserId
		}
		let obj: any = this;
		this.apiService.processRequestData(data).subscribe((res: any) => {
			if (res.status == 200) {
				$(".acceptpanel").css('display', 'none');
				obj.socket.emit('userPresence', {
					username: obj.userId
				});
			}
		});
	}

	declineRequest() {
		let data = {
			url: 'contacts/decline',
			userId: this.userId,
			contact_id: this.selectedUserId
		}
		let obj: any = this;
		this.apiService.processRequestData(data).subscribe((res: any) => {
			if(res.status == 200) {
				$("#" + obj.selectedUserId).remove();
				obj.socket.emit('userPresence', {
					username: obj.userId
				});
			}
		});
	}

	acceptCall() {
		window.location.href = '/#/videocall?user_id=' + this.callingUser + '&type=video&icon=' + this.callingUserAvatar;
	}

	refuseCall() {
		let obj = this;
		$("#callmodal").animate({ marginRight: "-400px" });
		this.socket.emit('refusecall', { callUserId: obj.callingUser });
	}

	httpEvent:HttpEvent<{}>

	selectFile(e) {
		let obj = this;
		let fileElem: any = document.getElementById('attachmentfile');
		let formData = new FormData();
		formData.append('file', fileElem.files[0]);

		const config = new HttpRequest('POST', this.apiService.apiURL + '/messages/uploadfiles', formData, {
		  reportProgress: true,
		});
		
		return this.HttpClient.request( config )
		.subscribe(event=>{
		  this.httpEvent = event
		  
		  if (event instanceof HttpResponse) {
			let data: any = event.body;
			obj.message = this.apiService.apiURL + '/uploaded/messages/' + data.fileId;
			$(".submit").trigger('click');
		  }
		},
		error=>{
		  console.log('!failure beyond compare cause:' + error.toString())
		})
	}
}
