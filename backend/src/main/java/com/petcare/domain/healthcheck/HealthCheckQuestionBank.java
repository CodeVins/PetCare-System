package com.petcare.domain.healthcheck;

import com.petcare.domain.healthcheck.dto.Question;
import com.petcare.domain.healthcheck.dto.QuestionOption;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.stereotype.Component;

// ponytail: 질문/점수는 고정된 자가 문진 휴리스틱이라 코드에 하드코딩. 문항이 많아지거나 운영진이
// 직접 편집해야 하면 DB 테이블로 옮길 것.
@Component
public class HealthCheckQuestionBank {

	private final List<Question> questions = List.of(
			new Question("appetite", "식욕", "최근 며칠간 식욕이 어떤가요?", List.of(
					new QuestionOption("normal", "평소와 같다", 0),
					new QuestionOption("reduced", "약간 줄었다", 1),
					new QuestionOption("none", "거의 먹지 않는다", 3))),
			new Question("stool", "배변", "최근 배변 상태는 어떤가요?", List.of(
					new QuestionOption("normal", "정상", 0),
					new QuestionOption("soft", "무르거나 설사한다", 2),
					new QuestionOption("blood", "혈변이 보인다", 4))),
			new Question("vomit", "구토", "최근 구토 증상이 있었나요?", List.of(
					new QuestionOption("none", "없음", 0),
					new QuestionOption("once", "1~2회", 1),
					new QuestionOption("repeated", "반복적으로 있었다", 3))),
			new Question("energy", "기력", "평소와 비교해 기력/활동량은 어떤가요?", List.of(
					new QuestionOption("normal", "평소와 같다", 0),
					new QuestionOption("low", "조금 처진다", 1),
					new QuestionOption("lethargic", "거의 움직이지 않는다", 3))),
			new Question("skin", "피부/털", "피부나 털 상태는 어떤가요?", List.of(
					new QuestionOption("normal", "정상", 0),
					new QuestionOption("itchy", "가려움이나 탈모가 일부 있다", 1),
					new QuestionOption("severe", "심한 발적이나 상처가 있다", 3))),
			new Question("breathing", "호흡", "호흡이 평소와 다른가요?", List.of(
					new QuestionOption("normal", "정상", 0),
					new QuestionOption("cough", "가끔 기침을 한다", 1),
					new QuestionOption("labored", "헐떡임이나 거친 숨소리가 지속된다", 3))),
			new Question("water", "음수", "물 마시는 양은 어떤가요?", List.of(
					new QuestionOption("normal", "평소와 같다", 0),
					new QuestionOption("increased", "눈에 띄게 늘었다", 1),
					new QuestionOption("none", "거의 마시지 않는다", 2))),
			new Question("weight", "체중", "최근 체중 변화가 있나요?", List.of(
					new QuestionOption("none", "없음", 0),
					new QuestionOption("slight", "약간 감소하거나 증가했다", 1),
					new QuestionOption("drastic", "급격하게 변화했다", 3))));

	private final Map<String, Question> questionsById = questions.stream()
			.collect(Collectors.toMap(Question::id, q -> q));

	public List<Question> getQuestions() {
		return questions;
	}

	public Question findQuestion(String questionId) {
		return questionsById.get(questionId);
	}
}
