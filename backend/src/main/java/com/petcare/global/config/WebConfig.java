package com.petcare.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	private final String petImageDir;
	private final String hospitalImageDir;

	public WebConfig(
			@Value("${app.upload.pet-image-dir}") String petImageDir,
			@Value("${app.upload.hospital-image-dir}") String hospitalImageDir) {
		this.petImageDir = petImageDir;
		this.hospitalImageDir = hospitalImageDir;
	}

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry.addResourceHandler("/uploads/pets/**")
				.addResourceLocations("file:" + petImageDir + "/");
		registry.addResourceHandler("/uploads/hospitals/**")
				.addResourceLocations("file:" + hospitalImageDir + "/");
	}
}
