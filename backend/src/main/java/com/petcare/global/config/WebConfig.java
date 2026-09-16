package com.petcare.global.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebConfig implements WebMvcConfigurer {

	private final String petImageDir;

	public WebConfig(@Value("${app.upload.pet-image-dir}") String petImageDir) {
		this.petImageDir = petImageDir;
	}

	@Override
	public void addResourceHandlers(ResourceHandlerRegistry registry) {
		registry.addResourceHandler("/uploads/pets/**")
				.addResourceLocations("file:" + petImageDir + "/");
	}
}
