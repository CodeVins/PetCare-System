package com.petcare.domain.user.dto;

// 비밀번호로 가입한 계정은 필수, 카카오 로그인 계정은 비워도 됨(비밀번호가 없어서)
public record WithdrawRequest(String password) {
}
