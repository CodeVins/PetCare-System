package com.petcare.domain.healthcheck;

import com.petcare.domain.healthcheck.dto.AnswerItem;
import com.petcare.domain.healthcheck.dto.HealthCheckResultResponse;
import com.petcare.domain.healthcheck.dto.HealthCheckSubmitRequest;
import com.petcare.domain.healthcheck.dto.Question;
import com.petcare.domain.healthcheck.dto.QuestionOption;
import com.petcare.domain.pet.HealthRecordService;
import com.petcare.domain.pet.HealthRecordType;
import com.petcare.domain.pet.PetService;
import com.petcare.domain.pet.dto.HealthRecordCreateRequest;
import com.petcare.domain.pet.dto.HealthRecordResponse;
import com.petcare.global.exception.BadRequestException;
import java.time.LocalDate;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 위험도 점수 구간(LOW/MEDIUM/HIGH)은 검증된 임상 통계가 아니라 이 서비스에서 정한 단순 휴리스틱이다.
 * 실제 품종/연령별 평균치 데이터가 없어서, comparisonNote에 그 사실을 그대로 안내한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HealthCheckService {

	private static final int MEDIUM_THRESHOLD = 4;
	private static final int HIGH_THRESHOLD = 10;

	private final HealthCheckQuestionBank questionBank;
	private final PetService petService;
	private final HealthRecordService healthRecordService;

	public List<Question> getQuestions() {
		return questionBank.getQuestions();
	}

	@Transactional
	public HealthCheckResultResponse submit(Long userId, HealthCheckSubmitRequest request) {
		petService.verifyAccess(userId, request.petId());

		int totalScore = request.answers().stream()
				.mapToInt(answer -> scoreOf(answer))
				.sum();
		RiskLevel riskLevel = toRiskLevel(totalScore);
		String comparisonNote = "품종/연령별 실제 평균치 데이터는 없어 점수 구간 기준으로만 판정했습니다.";
		String disclaimer = "이 결과는 참고용 자가 문진이며 진단이 아닙니다. 이상 소견이 있다면 반드시 수의사 진료를 받으세요.";

		Long savedRecordId = null;
		if (Boolean.TRUE.equals(request.saveRecord())) {
			String content = "자가 문진 결과: 총점 " + totalScore + "점 (위험도: " + riskLevel + ")";
			HealthRecordResponse saved = healthRecordService.create(userId, request.petId(),
					new HealthRecordCreateRequest(HealthRecordType.HEALTH_CHECK, LocalDate.now(), content, null, null));
			savedRecordId = saved.id();
		}

		return new HealthCheckResultResponse(totalScore, riskLevel, comparisonNote, disclaimer, savedRecordId);
	}

	private int scoreOf(AnswerItem answer) {
		Question question = questionBank.findQuestion(answer.questionId());
		if (question == null) {
			throw new BadRequestException("존재하지 않는 질문입니다: " + answer.questionId());
		}
		return question.options().stream()
				.filter(option -> option.id().equals(answer.optionId()))
				.map(QuestionOption::riskScore)
				.findFirst()
				.orElseThrow(() -> new BadRequestException("존재하지 않는 답변입니다: " + answer.optionId()));
	}

	private RiskLevel toRiskLevel(int totalScore) {
		if (totalScore >= HIGH_THRESHOLD) {
			return RiskLevel.HIGH;
		}
		if (totalScore >= MEDIUM_THRESHOLD) {
			return RiskLevel.MEDIUM;
		}
		return RiskLevel.LOW;
	}
}
