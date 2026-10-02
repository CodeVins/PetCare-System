package com.petcare.domain.hospital;

/**
 * 중심 좌표에서 반경 radiusKm을 감싸는 위경도 사각형 — DB에서 후보를 먼저 거르는 용도(정확한 원 판정은 Haversine으로 따로).
 * ponytail: 날짜변경선(경도 ±180)·극지방은 고려 안 함 — 국내 병원만 다루므로
 */
public record GeoBox(double minLat, double maxLat, double minLng, double maxLng) {

	private static final double KM_PER_LAT_DEGREE = 111.32;

	public static GeoBox around(double lat, double lng, double radiusKm) {
		double dLat = radiusKm / KM_PER_LAT_DEGREE;
		// 경도 1도의 거리는 위도가 높을수록 cos(위도)만큼 줄어듦
		double dLng = radiusKm / (KM_PER_LAT_DEGREE * Math.cos(Math.toRadians(lat)));
		return new GeoBox(lat - dLat, lat + dLat, lng - dLng, lng + dLng);
	}
}
