import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { Socket } from 'ngx-socket-io';
import * as $ from 'jquery';
import Giphy from 'giphy-api';
import { ApiService } from '../api.service';
import { DomSanitizer, SafeResourceUrl, SafeUrl } from '@angular/platform-browser';
import {
	HttpClient, HttpRequest, HttpResponse, HttpEvent
  } from "@angular/common/http";

@Component({
	selector: 'app-videocall',
	templateUrl: './videocall.component.html',
	styleUrls: ['./videocall.component.scss']
})
export class VideocallComponent implements OnInit {

	@ViewChild('preview') d1: ElementRef;
	ctx: any;
	cv: any;

	peer;
	targetpeer;
	n = <any>navigator;

	userId = sessionStorage.getItem('user_id');
	useravatar = sessionStorage.getItem('user_avatar') ? sessionStorage.getItem('user_avatar') : 'assets/images/users/user.png';

	contact_id = '';

	message: any = '';
	showEmoji: boolean = false;

	showGiphySearch = false;
	giphySearchTerm = '';
	giphyResults = [];
	showMessagePanel = true;
	mediaType = 'audio';
	selectedAvartarUrl = '';
	mediaRecorder: any;

	constructor(public HttpClient:HttpClient, public elementRef: ElementRef, public socket: Socket, private route: ActivatedRoute, private apiService: ApiService, private sanitizer: DomSanitizer) {
		this.route.queryParams.subscribe(params => {
			this.contact_id = params['user_id'];
			this.mediaType = params['type'];
			this.selectedAvartarUrl = params['icon'];
		});
	}

	connect() {
		this.peer.signal(this.targetpeer);
	}

	sendmessage() {
		this.peer.send('Hello world')
	}

	ngOnInit() {
		let obj: any = this;
		$("#cimg").css('width', '200px');
		$("#cimg").css('height', '200px');
		$("#cimg").css('max-width', '250px');
		$("#cimg").css('max-height', '250px');
		$("#cimg").css('border-radius', '200px');
		$("#cimg").attr('src', this.selectedAvartarUrl);

		this.n.getUserMedia = (this.n.getUserMedia || this.n.webkitGetUserMedia || this.n.mozGetUserMedia || this.n.msgGetUserMedia);

		this.n.getUserMedia({ video: false, audio: true }, function (stream) {
			obj.mediaRecorder = new MediaRecorder(stream);
			obj.mediaRecorder.start();
			let audioChunks: any = [];

			obj.mediaRecorder.addEventListener("dataavailable", event => {
				audioChunks[0] = event.data;
			});

			obj.mediaRecorder.addEventListener("stop", () => {
				const audioBlob = new Blob(audioChunks);
				const audioUrl = URL.createObjectURL(audioBlob);
				obj.socket.emit('broadcast', {toUserId: obj.userId, streamData: audioUrl})
				obj.mediaRecorder.start();
			});

			setInterval(() => {
				obj.mediaRecorder.stop();
			}, 200);

		}, function(err) {
			console.log('Failed to get stream: ', err);
		});

		if(this.mediaType == 'audio') {
			$("#cimg").css('width', '200px');
			$("#cimg").css('height', '200px');
			$("#cimg").css('max-width', '250px');
			$("#cimg").css('max-height', '250px');
			$("#cimg").css('border-radius', '200px');
			$("#cimg").attr('src', this.selectedAvartarUrl);

		} else {
			$("#cimg").css('width', '100%');
			$("#cimg").css('height', '100%');
			$("#cimg").css('max-width', '100%');
			$("#cimg").css('max-height', '100%');
			$("#cimg").css('border-radius', '0px');
		}
		this.cv = this.elementRef.nativeElement.querySelector('#preview');
		this.ctx = this.cv.getContext('2d');

		this.cv.width = 400;
		this.cv.height = 300;

		this.ctx.width = this.cv.width;
		this.ctx.height = this.cv.height;

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

		obj.socket.on('stream', function (data) {
			var d1 = obj.elementRef.nativeElement.querySelector('#cimg');
			d1.src = data.data;
			if (d1.src) {
				$("#cimg").css('width', '100%');
				$("#cimg").css('height', '100%');
				$("#cimg").css('max-width', '100%');
				$("#cimg").css('max-height', '100%');
				$("#cimg").css('border-radius', '0px');
			} else {
				$("#cimg").css('width', '200px');
				$("#cimg").css('height', '200px');
				$("#cimg").css('max-width', '250px');
				$("#cimg").css('max-height', '250px');
				$("#cimg").css('border-radius', '200px');
				$("#cimg").attr('src', this.selectedAvartarUrl);
			}
		});

		obj.socket.on('audio', function (data) {
			var binaryData = [];
			binaryData.push(data);
			let videoElement: any = document.getElementById('othervideo');
			videoElement.src = window.URL.createObjectURL(new Blob(binaryData, { type: "video/webm" }));
		});

		obj.socket.on('broadcast', function (data) {
			const audio = new Audio(data);
      		audio.play();
		});

		obj.socket.on('message', function (data) {
			var d1 = obj.elementRef.nativeElement.querySelector('.messages ul');
			d1.insertAdjacentHTML('beforeend', '<li ' + obj.getContentAttr() + ' class="replies"><img ' + obj.getContentAttr() + ' src="http://emilcarlsson.se/assets/mikeross.png" alt="" /><p ' + obj.getContentAttr() + '>' + data + '</p></li>')
			$(".messages").animate({ scrollTop: 99999999999999 }, "fast");
		});

		obj.socket.on('disconnect', function () {
			// To intimate other clients about disconnection from server
			obj.socket.emit('disconnect', {
				username: obj.userId
			});
		});

		obj.socket.on('refusecall', function() {
			obj.stopAudioTrack();
			window.location.href = '/#/home';
		});

		$(".messages").animate({ scrollTop: $(document).height() }, "fast");

		$("#profile-img").click(function () {
			$("#status-options").toggleClass("active");
		});

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
			console.log(obj.realmessage);
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

			d1.insertAdjacentHTML('beforeend', '<li ' + obj.getContentAttr() + ' class="sent"><img ' + obj.getContentAttr() + ' src="http://emilcarlsson.se/assets/mikeross.png" alt="" /><p ' + obj.getContentAttr() + '>' + message + linkstring + '</p></li>')
			// $('.message-input input').val(null);
			$(".messages").animate({ scrollTop: 99999999999999 }, "fast");
			obj.emojis = [];
			obj.message = '';
			obj.socket.emit('message', {
				fromUsername: obj.userId,
				toUsername: obj.contact_id,
				data: message
			});
		};

		$('.submit').click(function () {
			newMessage();
		});

		$(window).on('keydown', function (e) {
			if (e.which == 13) {
				newMessage();
				return false;
			}
		});
		obj.getUserMedia('video', 0, function () { });

		obj.apiService.getDataById({ url: "messages", id: obj.contact_id + '_' + this.userId }).subscribe((res: any) => {
			obj.messages = res;
		});
	}

	realmessage = '';
	emojis = [];
	addEmoji(event) {
		const { message } = this;

		const text = `${message}${event.emoji.colons}`;
		let emojidata = {
			name: event.emoji.colons,
			cont: event.$event.target
		}
		this.emojis.push(emojidata);

		this.message = text;
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

	toggleMessagePanel() {
		this.showMessagePanel = !this.showMessagePanel;
		if (this.showMessagePanel == true) {
			$(".videopanel").css('width', '100%');
			$(".bottomToolbar").css('width', '100%');
		}
		else {
			$(".videopanel").css('width', 'calc(100% - 350px)');
			$(".bottomToolbar").css('width', 'calc(100% - 350px)');
		}
	}

	getUserMedia(mediaType, type, callback) {
		var obj = this;
		var mediaStreamConstraints = {};
		// var window = window;
		if (mediaType == 'audio') {
			mediaStreamConstraints = {
				audio: false
			};
			obj.mediaType = 'audio';
		} else if (mediaType == 'video') {
			mediaStreamConstraints = {
				audio: false,
				video: {
					optional: [],
					mandatory: {}
				}
			};
			obj.mediaType = 'video';
		}
		// navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msgGetUserMedia);
		// if(navigator.getUserMedia) {
		navigator.getUserMedia(mediaStreamConstraints, function (stream) {
			var d1 = obj.elementRef.nativeElement.querySelector('#yourvideo');
			d1.srcObject = stream;
			d1.mute =  true;
			d1.play();
			let uwin: any = window;

			if (type == 1) {
				d1.volume = (d1.volume == 0 ? 1 : 0);
				if (d1.volume == 1) {
					$("#mute").find('i').removeClass('fa-microphone').addClass('fa-microphone-slash');
				} else {
					$("#mute").find('i').removeClass('fa-microphone-slash').addClass('fa-microphone');
				}
			}
			setInterval(function () {
				// let srcurl = window.URL.createObjectURL(stream);
				obj.ctx.drawImage(d1, 0, 0, obj.ctx.width, obj.ctx.height);
				obj.socket.emit('stream', { toUsername: obj.contact_id, imageData: obj.cv.toDataURL('image/webp') });
			}, 70);
			// d1.src = UWin.URL.createObjectURL(stream);
		}, function (err) {
			console.log(err)
		});
		// }
	}

	stopVideoCall() {
		let obj = this;
		this.mediaRecorder.stop();
		obj.stopAudioTrack();
		this.socket.emit('refusecall', { callUserId: obj.contact_id });
		window.location.href = '/#/home';
	}

	toggleAudio() {
		this.getUserMedia(this.mediaType, 1, function () { });
	}

	toggleCamera() {

	}

	decode(text: string): any {
		return this.sanitizer.bypassSecurityTrustHtml(text);
	}

	stopAudioTrack() {
		let cwin: any = window;
		var MediaStream = cwin.MediaStream;

		if (typeof MediaStream === 'undefined' && typeof webkitMediaStream !== 'undefined') {
			MediaStream = webkitMediaStream;
		}

		/*global MediaStream:true */
		if (typeof MediaStream !== 'undefined' && !('stop' in MediaStream.prototype)) {
			MediaStream.prototype.stop = function() {
				this.getTracks().forEach(function(track) {
					track.stop();
				});
			};
		}
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
