package com.petcare.domain.pet;

import com.petcare.domain.pet.dto.FeedingCalculatorRequest;
import com.petcare.domain.pet.dto.FeedingCalculatorResponse;
import java.util.Map;
import org.springframework.stereotype.Service;

/**
 * RER = 70 * (체중kg)^0.75, DER = RER * 활동계수. 참고: PetFoodMaster, PetCare AI 자료 기반.
 *
 * <p>DER 활동계수 기준: 원 자료는 "중성화 여부"로 계수를 나누지만(강아지 중성화O 1.6 / 중성화X 1.8 /
 * 체중감량 1.4, 고양이 중성화O 1.2), 이 API의 입력은 활동량(LOW/NORMAL/HIGH)이라 아래처럼 매핑했다:
 * - 강아지: LOW=1.4(체중감량과 동일 취급), NORMAL=1.6(중성화 기준), HIGH=1.8(중성화X/활동적)
 * - 고양이: 자료에 NORMAL(중성화O)=1.2 하나만 있어서, 강아지와 같은 0.2 간격으로 LOW=1.0, HIGH=1.4를 추정
 * 실제 서비스에 쓰려면 수의사 자문으로 계수를 재검증할 것.
 */
@Service
public class FeedingCalculatorService {

	private static final double DEFAULT_DRY_FOOD_CALORIE_PER_100G = 350;

	private static final Map<PetSpecies, Map<ActivityLevel, Double>> DER_COEFFICIENTS = Map.of(
			PetSpecies.DOG, Map.of(
					ActivityLevel.LOW, 1.4,
					ActivityLevel.NORMAL, 1.6,
					ActivityLevel.HIGH, 1.8),
			PetSpecies.CAT, Map.of(
					ActivityLevel.LOW, 1.0,
					ActivityLevel.NORMAL, 1.2,
					ActivityLevel.HIGH, 1.4));

	public FeedingCalculatorResponse calculate(FeedingCalculatorRequest request) {
		double rer = 70 * Math.pow(request.weightKg(), 0.75);
		double coefficient = DER_COEFFICIENTS.get(request.species()).get(request.activityLevel());
		double dailyCalories = rer * coefficient;

		double foodCalorieDensity = request.foodCalorieDensityPer100g() != null
				? request.foodCalorieDensityPer100g()
				: DEFAULT_DRY_FOOD_CALORIE_PER_100G;
		double foodAmountGrams = dailyCalories * 100 / foodCalorieDensity;

		String disclaimer = "이 계산값은 건강한 성체 기준 추정값입니다. 질환, 임신·수유 중이거나 "
				+ "기저질환이 있는 경우 수의사와 상담 후 급여량을 조정하세요.";

		return new FeedingCalculatorResponse(rer, coefficient, dailyCalories, foodCalorieDensity, foodAmountGrams, disclaimer);
	}
}
