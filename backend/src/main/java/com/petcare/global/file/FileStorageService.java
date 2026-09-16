package com.petcare.global.file;

import com.petcare.global.exception.BadRequestException;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class FileStorageService {

	private static final Map<String, String> ALLOWED_EXTENSIONS_BY_CONTENT_TYPE = Map.of(
			"image/jpeg", ".jpg",
			"image/png", ".png",
			"image/webp", ".webp"
	);

	private final Path petImageDir;

	public FileStorageService(@Value("${app.upload.pet-image-dir}") String petImageDir) {
		this.petImageDir = Path.of(petImageDir).toAbsolutePath().normalize();
		try {
			Files.createDirectories(this.petImageDir);
		} catch (IOException e) {
			throw new UncheckedIOException("업로드 디렉터리를 생성할 수 없습니다.", e);
		}
	}

	public String storePetImage(MultipartFile file) {
		if (file == null || file.isEmpty()) {
			throw new BadRequestException("이미지 파일을 선택해주세요.");
		}
		String extension = ALLOWED_EXTENSIONS_BY_CONTENT_TYPE.get(file.getContentType());
		if (extension == null) {
			throw new BadRequestException("jpg, png, webp 형식의 이미지만 업로드할 수 있습니다.");
		}

		String filename = UUID.randomUUID() + extension;
		try {
			file.transferTo(petImageDir.resolve(filename));
		} catch (IOException e) {
			throw new UncheckedIOException("이미지 저장에 실패했습니다.", e);
		}

		return "/uploads/pets/" + filename;
	}

	public void deletePetImage(String imageUrl) {
		if (imageUrl == null || imageUrl.isBlank()) {
			return;
		}
		String filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
		try {
			Files.deleteIfExists(petImageDir.resolve(filename));
		} catch (IOException e) {
			throw new UncheckedIOException("이미지 삭제에 실패했습니다.", e);
		}
	}
}
