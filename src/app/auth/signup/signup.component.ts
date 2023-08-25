import { Component, OnInit } from '@angular/core';
import * as $ from 'jquery';
import { ApiService } from '../../api.service';
import { ToastrService } from 'ngx-toastr';

@Component({
    selector: 'app-signup',
    templateUrl: './signup.component.html',
    styleUrls: ['./signup.component.scss']
})
export class SignupComponent implements OnInit {
    email: any = '';
    name: any = '';
    password: any = '';

    constructor(public apiService: ApiService, private toastr: ToastrService) { }

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
            if (check == false)
                return false;
            else {
                obj.registerUser();
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

    registerUser() {
        let obj = this;

        let data = {
            url: 'users',
            name: this.name,
            email: this.email,
            password: this.password
        }
        this.apiService.registerUser(data).subscribe((res: any) => {
            if(res.status == 200) {
                obj.toastr.success("Success register!",'Success');
                setTimeout(function() {
                    window.location.href = '/#/';
                }, 1500);
            } else {
                obj.toastr.warning("Network Error",'Warning');
            }
        })
    }

}
