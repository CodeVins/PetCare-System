package com.petcare.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	private final String petImageDir;
	private final String hospitalImageDir;
	private final String reviewImageDir;

	// 변경(2026-10-05): 리뷰 사진 경로(/uploads/reviews/**) 서빙 추가 (이전: 반려동물·병원 사진만)
	public WebConfig(
			@Value("${app.upload.pet-image-dir}") String petImageDir,
			@Value("${app.upload.hospital-image-dir}") String hospitalImageDir,
			@Value("${app.upload.review-image-dir}") String reviewImageDir) {
		this.petImageDir = petImageDir;
		this.hospitalImageDir = hospitalImageDir;
		this.reviewImageDir = reviewImageDir;
	}

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry.addResourceHandler("/uploads/pets/**")
				.addResourceLocations("file:" + petImageDir + "/");
		registry.addResourceHandler("/uploads/hospitals/**")
				.addResourceLocations("file:" + hospitalImageDir + "/");
		registry.addResourceHandler("/uploads/reviews/**")
				.addResourceLocations("file:" + reviewImageDir + "/");
	}
}
