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
	private final Path hospitalImageDir;

	public FileStorageService(
			@Value("${app.upload.pet-image-dir}") String petImageDir,
			@Value("${app.upload.hospital-image-dir}") String hospitalImageDir) {
		this.petImageDir = createDir(petImageDir);
		this.hospitalImageDir = createDir(hospitalImageDir);
	}

	private Path createDir(String dir) {
		Path path = Path.of(dir).toAbsolutePath().normalize();
		try {
			Files.createDirectories(path);
		} catch (IOException e) {
			throw new UncheckedIOException("업로드 디렉터리를 생성할 수 없습니다.", e);
		}
		return path;
	}

	public String storePetImage(MultipartFile file) {
		return store(file, petImageDir, "/uploads/pets/");
	}

	public void deletePetImage(String imageUrl) {
		delete(imageUrl, petImageDir);
	}

	public String storeHospitalImage(MultipartFile file) {
		return store(file, hospitalImageDir, "/uploads/hospitals/");
	}

	public void deleteHospitalImage(String imageUrl) {
		delete(imageUrl, hospitalImageDir);
	}

	private String store(MultipartFile file, Path dir, String urlPrefix) {
		if (file == null || file.isEmpty()) {
			throw new BadRequestException("이미지 파일을 선택해주세요.");
		}
		String extension = ALLOWED_EXTENSIONS_BY_CONTENT_TYPE.get(file.getContentType());
		if (extension == null) {
			throw new BadRequestException("jpg, png, webp 형식의 이미지만 업로드할 수 있습니다.");
		}

		String filename = UUID.randomUUID() + extension;
		try {
			file.transferTo(dir.resolve(filename));
		} catch (IOException e) {
			throw new UncheckedIOException("이미지 저장에 실패했습니다.", e);
		}

		return urlPrefix + filename;
	}

	private void delete(String imageUrl, Path dir) {
		if (imageUrl == null || imageUrl.isBlank()) {
			return;
		}
		String filename = imageUrl.substring(imageUrl.lastIndexOf('/') + 1);
		try {
			Files.deleteIfExists(dir.resolve(filename));
		} catch (IOException e) {
			throw new UncheckedIOException("이미지 삭제에 실패했습니다.", e);
		}
	}
}
