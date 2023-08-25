import { Component, OnInit } from '@angular/core';
import { Router} from '@angular/router';
import * as $ from 'jquery';
import { ApiService } from '../../api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {
    email: string = '';
    password: string = '';

    constructor(public apiService: ApiService, private toastr: ToastrService, private router: Router) { }

    ngOnInit() {
        let obj = this;
        /*==================================================================
        [ Validate ]*/
        var input = $('.validate-input .input100');

        $('.validate-form').on('submit', function () {
            var check = true;

            for (var i = 0; i < input.length; i++) {
                if (validate(input[i]) == false) {
                    showValidate(input[i]);
                    check = false;
                }
            }
            if(check == false) 
                return false;
            else {
                obj.checkInfo();
            }
                
            return false;
        });


        $('.validate-form .input100').each(function () {
            $(this).focus(function () {
                hideValidate(this);
            });
        });

        function validate(input) {
            if ($(input).attr('type') == 'email' || $(input).attr('name') == 'email') {
                if ($(input).val().trim().match(/^([a-zA-Z0-9_\-\.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([a-zA-Z0-9\-]+\.)+))([a-zA-Z]{1,5}|[0-9]{1,3})(\]?)$/) == null) {
                    return false;
                }
            }
            else {
                if ($(input).val().trim() == '') {
                    return false;
                }
            }
        }

        function showValidate(input) {
            var thisAlert = $(input).parent();

            $(thisAlert).addClass('alert-validate');
        }

        function hideValidate(input) {
            var thisAlert = $(input).parent();

            $(thisAlert).removeClass('alert-validate');
        }

    }

    checkInfo() {
        let obj = this;
        let data = {
            "url": "users/login",
            "email": this.email,
            "password": this.password
        }
        
        this.apiService.loginCheck(data).subscribe((res: any)=>{
            if(res.status == 200) {
                obj.toastr.success("Success Login",'Success');
                obj.apiService.setRequestHeader(res.data.access_key);
                sessionStorage.setItem('x-auth', res.data.access_key);
                sessionStorage.setItem('user_id', res.data._id);
                sessionStorage.setItem('user_name', res.data.name);
                sessionStorage.setItem('user_email', res.data.email);
                sessionStorage.setItem('user_info', JSON.stringify(res.data));
                sessionStorage.setItem('user_avatar', res.data.avatar_url ? res.data.avatar_url : 'assets/images/users/user.png');
                obj.router.navigate( ["/#/home"] );
            } else {
                if(res.message == 'notuserexist') {
                    obj.toastr.warning("Please register now",'Warning');
                } else {
                    obj.toastr.warning("Wrong password. Please enter password again",'Warning');
                }
            }
        });
    }

}
