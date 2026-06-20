from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func, literal
from app.core.deps import get_current_user, get_db
from app.core.exceptions import APIException
from app.modules.submissions.models import Submissions
from app.modules.submissions.schemas import SubmissionStatusSchema
from app.authorization.TLConfig import TL
from .models import Problems, ProblemExamples, ProblemConstraints, ProblemTags, TestCases, ProblemStats
from app.modules.problems.schemas import ProblemListSchema, ProblemDetailSchema, ProblemCreateSchema, ProblemUpdateSchema

router = APIRouter(prefix="/problems", tags=["Problems"])


@router.get("/", response_model=dict)
async def get_problems(
    request: Request,
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    difficulty: str | None = None,
    category: str | None = None,
    db: AsyncSession = Depends(get_db),
):
    """Lấy danh sách bài toán"""
    # feature: giải mã cookie token để xác định user hiện tại
    user = None
    access_token = request.cookies.get("access_token")
    if access_token:
        try:
            user = TL.verify(access_token)
        except Exception:
            pass 

    try:
        filters = []
        if difficulty:
            filters.append(Problems.difficulty == difficulty)
        if category:
            filters.append(Problems.category == category)

        # feature: tính tổng record dựa trên filter phục vụ metadata phân trang
        total = await db.scalar(
            select(func.count(Problems.id)).where(*filters)
        )

        # feature: expression kiểm tra user đã AC (Accepted) bài này chưa
        if user:
            is_solved_expr = (
                select(1)
                .where(
                    (Submissions.problem_id == Problems.id) &
                    (Submissions.user_id == user['id']) &
                    (Submissions.status == SubmissionStatusSchema.ACCEPTED.value) 
                )
                .exists()
            ).label("is_solved")
        else:
            is_solved_expr = literal(False).label("is_solved")

        # feature: truy vấn gộp thông tin Problems, ProblemStats (để tính rate) và trạng thái is_solved
        query = (
            select(Problems, ProblemStats.accepted, ProblemStats.attempts, is_solved_expr)
            .outerjoin(ProblemStats, ProblemStats.problem_id == Problems.id)
            .where(*filters)
            .order_by(desc(Problems.created_at))
            .offset(skip)
            .limit(limit)
        )
        
        result = await db.execute(query)
        rows = result.all()

        data_response = []
        for problem_obj, accepted, attempts, is_solved in rows:
            # feature: tính tỷ lệ pass bài
            accepted = accepted or 0
            attempts = attempts or 0
            acceptance_rate = round(accepted * 100 / attempts, 2) if attempts > 0 else 0

            prob_dict = ProblemListSchema.model_validate(problem_obj).model_dump()
            prob_dict["acceptance_rate"] = acceptance_rate
            prob_dict["is_solved"] = is_solved
            data_response.append(prob_dict)

        return {
            "success": True,
            "data": data_response,
            "total": total or 0,
            "current_count": len(rows),
            "skip": skip,
            "limit": limit,
            "has_next": (skip + limit) < (total or 0),
        }

    except Exception as e:
        raise APIException(
            status_code=500,
            message=str(e)
        )


@router.get("/{endpoint}", response_model=dict)
async def get_problem_detail(endpoint: str, db: AsyncSession = Depends(get_db)):
    """Lấy chi tiết bài toán theo endpoint"""
    try:
        query = select(Problems).where(Problems.endpoint == endpoint)
        result = await db.execute(query)
        problem = result.scalars().first()
        
        if not problem:
            raise APIException(status_code=404, message="Bài toán không tìm thấy")
        
        examples_query = select(ProblemExamples).where(ProblemExamples.problem_id == problem.id).order_by(ProblemExamples.order_index)
        examples_result = await db.execute(examples_query)
        examples = examples_result.scalars().all()
        
        constraints_query = select(ProblemConstraints).where(ProblemConstraints.problem_id == problem.id).order_by(ProblemConstraints.order_index)
        constraints_result = await db.execute(constraints_query)
        constraints = constraints_result.scalars().all()
        
        tags_query = select(ProblemTags).where(ProblemTags.problem_id == problem.id)
        tags_result = await db.execute(tags_query)
        tags = tags_result.scalars().all()
        
        return {
            "success": True,
            "problem": {
                "id": problem.id,
                "endpoint": problem.endpoint,
                "title": problem.title,
                "difficulty": problem.difficulty.value,
                "category": problem.category,
                "description": problem.description,
                "point": problem.point,
                "examples": [{"id": ex.id, "input_text": ex.input_text, "output_text": ex.output_text, "explanation": ex.explanation, "order_index": ex.order_index} for ex in examples],
                "constraints": [{"id": con.id, "constraint_text": con.constraint_text, "order_index": con.order_index} for con in constraints],
                "tags": [{"id": tag.id, "tag_name": tag.tag_name} for tag in tags],
                "created_at": problem.created_at,
                "updated_at": problem.updated_at
            }
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        raise APIException(status_code=500, message=str(e))


@router.post("/", response_model=dict)
async def create_problem(problem_data: ProblemCreateSchema, db: AsyncSession = Depends(get_db)):
    """Tạo bài toán mới (Admin only)"""
    try:
        query = select(Problems).where(Problems.endpoint == problem_data.endpoint)
        result = await db.execute(query)
        existing = result.scalars().first()
        
        if existing:
            raise HTTPException(status_code=400, detail="Endpoint đã tồn tại")
        
        new_problem = Problems(endpoint=problem_data.endpoint, title=problem_data.title, difficulty=problem_data.difficulty, category=problem_data.category, description=problem_data.description, point=problem_data.point)
        db.add(new_problem)
        await db.flush()
        
        for example in problem_data.examples:
            new_example = ProblemExamples(problem_id=new_problem.id, input_text=example.input_text, output_text=example.output_text, explanation=example.explanation, order_index=example.order_index)
            db.add(new_example)
        
        for constraint in problem_data.constraints:
            new_constraint = ProblemConstraints(problem_id=new_problem.id, constraint_text=constraint.constraint_text, order_index=constraint.order_index)
            db.add(new_constraint)
        
        for tag in problem_data.tags:
            new_tag = ProblemTags(problem_id=new_problem.id, tag_name=tag.tag_name)
            db.add(new_tag)
        
        for test_case in problem_data.test_cases:
            new_test_case = TestCases(problem_id=new_problem.id, input_text=test_case.input_text, output_text=test_case.output_text, is_hidden=test_case.is_hidden)
            db.add(new_test_case)
        
        await db.commit()
        
        return {"success": True, "message": "create problem success!", "problem_id": new_problem.id}
    except HTTPException as e:
        await db.rollback()
        raise e
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{problem_id}", response_model=dict)
async def update_problem(problem_id: int, problem_data: ProblemUpdateSchema, db: AsyncSession = Depends(get_db)):
    """Cập nhật bài toán (Admin only)"""
    try:
        query = select(Problems).where(Problems.id == problem_id)
        result = await db.execute(query)
        problem = result.scalars().first()
        
        if not problem:
            raise HTTPException(status_code=404, detail="Bài toán không tìm thấy")
        
        if problem_data.title:
            problem.title = problem_data.title
        if problem_data.difficulty:
            problem.difficulty = problem_data.difficulty
        if problem_data.category:
            problem.category = problem_data.category
        if problem_data.description:
            problem.description = problem_data.description
        if problem_data.point is not None:
            problem.point = problem_data.point
        
        await db.commit()
        
        return {"success": True, "message": "Cập nhật bài toán thành công"}
    except HTTPException as e:
        await db.rollback()
        raise e
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{problem_id}", response_model=dict)
async def delete_problem(problem_id: int, db: AsyncSession = Depends(get_db)):
    """Xóa bài toán (Admin only)"""
    try:
        query = select(Problems).where(Problems.id == problem_id)
        result = await db.execute(query)
        problem = result.scalars().first()
        
        if not problem:
            raise HTTPException(status_code=404, detail="Bài toán không tìm thấy")
        
        await db.delete(problem)
        await db.commit()
        
        return {"success": True, "message": "Xóa bài toán thành công"}
    except HTTPException as e:
        await db.rollback()
        raise e
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{problem_id}/test-cases", response_model=dict)
async def get_test_cases(problem_id: int, db: AsyncSession = Depends(get_db)):
    """Lấy test case công khai của bài toán"""
    try:
        query = select(Problems).where(Problems.id == problem_id)
        result = await db.execute(query)
        problem = result.scalars().first()
        
        if not problem:
            raise HTTPException(status_code=404, detail="Bài toán không tìm thấy")
        
        test_cases_query = select(TestCases).where(TestCases.problem_id == problem_id, TestCases.is_hidden == False)
        test_cases_result = await db.execute(test_cases_query)
        test_cases = test_cases_result.scalars().all()
        
        return {"success": True, "test_cases": [{"id": tc.id, "input_text": tc.input_text, "output_text": tc.output_text} for tc in test_cases]}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{problem_id}/test-cases/all", response_model=dict)
async def get_all_test_cases(problem_id: int, db: AsyncSession = Depends(get_db)):
    """Lấy tất cả test case của bài toán (Admin only)"""
    try:
        query = select(Problems).where(Problems.id == problem_id)
        result = await db.execute(query)
        problem = result.scalars().first()
        
        if not problem:
            raise HTTPException(status_code=404, detail="Bài toán không tìm thấy")
        
        test_cases_query = select(TestCases).where(TestCases.problem_id == problem_id)
        test_cases_result = await db.execute(test_cases_query)
        test_cases = test_cases_result.scalars().all()
        
        return {"success": True, "test_cases": [{"id": tc.id, "input_text": tc.input_text, "output_text": tc.output_text, "is_hidden": tc.is_hidden} for tc in test_cases]}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{problem_id}/examples", response_model=dict)
async def add_example(problem_id: int, input_text: str, output_text: str, explanation: str = None, order_index: int = 0, db: AsyncSession = Depends(get_db)):
    """Thêm ví dụ cho bài toán"""
    try:
        query = select(Problems).where(Problems.id == problem_id)
        result = await db.execute(query)
        problem = result.scalars().first()
        
        if not problem:
            raise HTTPException(status_code=404, detail="Bài toán không tìm thấy")
        
        new_example = ProblemExamples(problem_id=problem_id, input_text=input_text, output_text=output_text, explanation=explanation, order_index=order_index)
        db.add(new_example)
        await db.commit()
        
        return {"success": True, "message": "Thêm ví dụ thành công", "example_id": new_example.id}
    except HTTPException as e:
        await db.rollback()
        raise e
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{problem_id}/constraints", response_model=dict)
async def add_constraint(problem_id: int, constraint_text: str, order_index: int = 0, db: AsyncSession = Depends(get_db)):
    """Thêm điều kiện cho bài toán"""
    try:
        query = select(Problems).where(Problems.id == problem_id)
        result = await db.execute(query)
        problem = result.scalars().first()
        
        if not problem:
            raise HTTPException(status_code=404, detail="Bài toán không tìm thấy")
        
        new_constraint = ProblemConstraints(problem_id=problem_id, constraint_text=constraint_text, order_index=order_index)
        db.add(new_constraint)
        await db.commit()
        
        return {"success": True, "message": "Thêm điều kiện thành công", "constraint_id": new_constraint.id}
    except HTTPException as e:
        await db.rollback()
        raise e
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{problem_id}/tags", response_model=dict)
async def add_tag(problem_id: int, tag_name: str, db: AsyncSession = Depends(get_db)):
    """Thêm tag cho bài toán"""
    try:
        query = select(Problems).where(Problems.id == problem_id)
        result = await db.execute(query)
        problem = result.scalars().first()
        
        if not problem:
            raise HTTPException(status_code=404, detail="Bài toán không tìm thấy")
        
        new_tag = ProblemTags(problem_id=problem_id, tag_name=tag_name)
        db.add(new_tag)
        await db.commit()
        
        return {"success": True, "message": "Thêm tag thành công", "tag_id": new_tag.id}
    except HTTPException as e:
        await db.rollback()
        raise e
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=str(e))