// server.js
const express = require('express');
const cors = require('cors'); // 1. استدعاء مكتبة CORS
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Log = require('./models/Log');
const LeaveRequest = require('./models/LeaveRequest');

const app = express(); // 2. تعريف التطبيق

// 3. استخدام الإضافات (الترتيب صحيح الآن)
app.use(cors());
app.use(express.json());

// الاتصال بـ MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('=== ✅ connected to MongoDB successfully ==='))
  .catch((err) => console.error('❌ Error when connecting to MongoDB:', err.message));

// ----------------------------------------
// 1. [مسار الأدمن]: إضافة كود واسم موظف/أدمن جديد
// ----------------------------------------
app.post('/api/admin/add-employee', async (req, res) => {
  try {
    const { employeeCode, name, role, jobGrade, workType, compensationBalance } = req.body;
    
    // 💡 التعديل هنا: شيلنا jobGrade من الشرط الأساسي عشان الأدمن ملوش درجة
    if (!employeeCode || !name) {
      return res.status(400).json({ message: 'برجاء إدخال البيانات الأساسية!' });
    }

    const existingUser = await User.findOne({ employeeCode });
    if (existingUser) {
      return res.status(400).json({ message: 'هذا الكود مسجل مسبقاً!' });
    }

    let userJobGrade = jobGrade;
    let userWorkType = workType || 'شيفت';
    let annualBalance = 0;

    // فصلنا المنطق: لو أدمن هنفضي الدرجة والنوع، لو موظف هنتأكد إنهم موجودين
    if (role === 'admin') {
      userJobGrade = undefined;
      userWorkType = undefined;
    } else {
      if (!jobGrade) return res.status(400).json({ message: 'برجاء اختيار الدرجة الوظيفية للموظف!' });
      annualBalance = (jobGrade === 'كبير' || jobGrade === 'درجة اولى') ? 30 : 21;
    }

    const newEmployee = new User({
      employeeCode,
      name,
      role: role || 'employee',
      jobGrade: userJobGrade,
      workType: userWorkType,
      leaveBalances: {
        annual: annualBalance,
        casual: role === 'admin' ? 0 : 7, // الأدمن ملوش عارضة
        compensation: compensationBalance || 0 
      }
    });

    await newEmployee.save();

    const newLog = new Log({
      action: 'EMPLOYEE_ADDED',
      details: `تم إضافة ${role === 'admin' ? 'مدير نظام' : 'موظف'}: ${name} (الكود: ${employeeCode})`,
      ipAddress: req.ip
    });
    await newLog.save();

    res.status(201).json({ message: 'تم الإضافة بنجاح!' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
});

// ----------------------------------------
// 2. [مسار الموظف]: تسجيل حساب جديد وتفعيل الباسوورد
// ----------------------------------------
app.post('/api/auth/register', async (req, res) => {
  try {
    const { employeeCode, password } = req.body;

    if (!employeeCode || !password) {
      return res.status(400).json({ message: 'برجاء إدخال كود الموظف وكلمة المرور الجديدة!' });
    }

    const user = await User.findOne({ employeeCode });
    if (!user) {
      return res.status(404).json({ message: 'الكود غير مسجل بالنظام!' });
    }

    if (user.isRegistered) {
      return res.status(400).json({ message: 'هذا الحساب مفعل ومسجل بالفعل!' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.isRegistered = true;
    await user.save();

    const newLog = new Log({
      action: 'USER_REGISTERED',
      performedBy: user._id, 
      details: `المستخدم ${user.name} قام بتفعيل حسابه.`,
      ipAddress: req.ip
    });
    await newLog.save();

    res.status(200).json({ message: 'تم تفعيل حسابك بنجاح!' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء التسجيل', error: error.message });
  }
});

// ----------------------------------------
// 3. [مسار تسجيل الدخول]: Login
// ----------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { employeeCode, password } = req.body;

    if (!employeeCode || !password) {
      return res.status(400).json({ message: 'برجاء إدخال كود المستخدم وكلمة المرور!' });
    }

    const user = await User.findOne({ employeeCode });
    if (!user) {
      return res.status(400).json({ message: 'الكود أو كلمة المرور غير صحيحة!' });
    }

    if (!user.isRegistered) {
      return res.status(400).json({ message: 'هذا الحساب غير مفعل بعد!' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'الكود أو كلمة المرور غير صحيحة!' });
    }

    const newLog = new Log({
      action: 'LOGIN_SUCCESS',
      performedBy: user._id,
      details: `تسجيل دخول ناجح: ${user.name}`,
      ipAddress: req.ip
    });
    await newLog.save();

    res.status(200).json({
      message: 'تم تسجيل الدخول بنجاح!',
      user: {
        id: user._id,
        employeeCode: user.employeeCode,
        name: user.name,
        role: user.role,
        leaveBalances: user.leaveBalances
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الدخول', error: error.message });
  }
});

// ----------------------------------------
// [مسار الإدارة]: إعادة ضبط حساب موظف (نسيان كلمة المرور)
// ----------------------------------------
app.post('/api/admin/reset-password', async (req, res) => {
  try {
    const { employeeCode } = req.body;

    if (!employeeCode) {
      return res.status(400).json({ message: 'برجاء إدخال الكود المراد تصفير حسابه.' });
    }

    const user = await User.findOne({ employeeCode });
    if (!user) {
      return res.status(404).json({ message: 'المستخدم غير موجود في النظام!' });
    }

    user.password = undefined;
    user.isRegistered = false;
    await user.save();

    res.status(200).json({ 
      message: `تم تصفير حساب (${user.name}) بنجاح.` 
    });

  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
});

// ----------------------------------------
// 4. [مسار الموظف]: تقديم طلب إجازة
// ----------------------------------------
app.post('/api/leaves/request', async (req, res) => {
  try {
    const { employeeCode, leaveType, startDate, endDate, reason } = req.body;

    if (!employeeCode || !leaveType || !startDate || !endDate) {
      return res.status(400).json({ message: 'برجاء استكمال جميع البيانات الأساسية للطلب!' });
    }

    const user = await User.findOne({ employeeCode });
    if (!user) {
      return res.status(404).json({ message: 'الموظف غير موجود!' });
    }

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'غير مسموح لمدير النظام بتقديم طلبات إجازة.' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (end < start) {
      return res.status(400).json({ message: 'تاريخ نهاية الإجازة لا يمكن أن يكون قبل تاريخ البداية!' });
    }

    if (leaveType !== 'casual' && start < today) {
      return res.status(400).json({ message: 'لا يمكن تقديم إجازة بأثر رجعي (يُسمح بذلك للإجازة العارضة فقط)!' });
    }

    const overlappingRequest = await LeaveRequest.findOne({
      employeeId: user._id,
      status: { $ne: 'rejected' },
      $or: [
        { startDate: { $lte: end }, endDate: { $gte: start } }
      ]
    });

    if (overlappingRequest) {
      return res.status(400).json({ message: 'لديك بالفعل طلب إجازة يتعارض مع هذه التواريخ!' });
    }

    const diffTime = Math.abs(end - start);
    const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (leaveType === 'casual') {
      if (duration > 2) {
        return res.status(400).json({ message: 'الإجازة العارضة لا يمكن أن تتجاوز يومين متصلين!' });
      }

      const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);

      const monthLeaves = await LeaveRequest.find({
        employeeId: user._id,
        leaveType: 'casual',
        status: { $ne: 'rejected' },
        startDate: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const takenCasualDaysThisMonth = monthLeaves.reduce((total, req) => total + req.duration, 0);

      if (takenCasualDaysThisMonth + duration > 2) {
        return res.status(400).json({ 
          message: `عفواً، لقد استنفذت الحد الأقصى للعارضة هذا الشهر (متبقي لك ${2 - takenCasualDaysThisMonth} يوم).` 
        });
      }
    }

    if (user.leaveBalances[leaveType] < duration) {
      return res.status(400).json({ 
        message: `رصيدك الحالي (${user.leaveBalances[leaveType]} أيام) لا يكفي لطلب ${duration} يوم!` 
      });
    }

    const newLeaveReq = new LeaveRequest({
      employeeId: user._id,
      leaveType,
      startDate: start,
      endDate: end,
      duration,
      reason
    });

    await newLeaveReq.save();

    const newLog = new Log({
      action: 'LEAVE_REQUESTED',
      performedBy: user._id,
      details: `قدم ${user.name} طلب إجازة (${leaveType}) لمدة ${duration} أيام.`,
      ipAddress: req.ip
    });
    await newLog.save();

    res.status(201).json({ 
      message: 'تم تقديم طلب الإجازة بنجاح.',
      durationRequested: duration,
      requestDetails: newLeaveReq
    });

  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تقديم الطلب', error: error.message });
  }
});

// ----------------------------------------
// 5. [مسار الموظف/الإدارة]: استخراج تقرير الإجازات
// ----------------------------------------
app.post('/api/leaves/report', async (req, res) => {
  try {
    const { employeeCode, startDate, endDate } = req.body;

    if (!employeeCode || !startDate || !endDate) {
      return res.status(400).json({ message: 'بيانات التقرير ناقصة!' });
    }

    const user = await User.findOne({ employeeCode });
    if (!user) return res.status(404).json({ message: 'الموظف غير موجود!' });

    const fromDate = new Date(startDate);
    fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(endDate);
    toDate.setHours(23, 59, 59, 999); 

    const leaves = await LeaveRequest.find({
      employeeId: user._id,
      status: 'approved',
      startDate: { $gte: fromDate },
      endDate: { $lte: toDate }
    }).sort({ startDate: 1 });

    const summary = { annual: 0, casual: 0, compensation: 0 };
    leaves.forEach(leave => {
      if (summary[leave.leaveType] !== undefined) {
        summary[leave.leaveType] += leave.duration;
      }
    });

    res.status(200).json({
      message: 'تم استخراج التقرير بنجاح.',
      employeeName: user.name,
      period: { from: startDate, to: endDate },
      totalConsumedDays: summary,
      detailedLeaves: leaves
    });

  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء استخراج التقرير', error: error.message });
  }
});

// ----------------------------------------
// 6. [مسار الموظف]: جلب سجل طلباته
// ----------------------------------------
app.get('/api/leaves/my-requests/:employeeCode', async (req, res) => {
  try {
    const { employeeCode } = req.params;
    const user = await User.findOne({ employeeCode });
    if (!user) return res.status(404).json({ message: 'الموظف غير موجود' });

    const requests = await LeaveRequest.find({ employeeId: user._id }).sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في السيرفر', error: error.message });
  }
});

// ----------------------------------------
// [مسار الإدارة]: جلب الطلبات المعلقة
// ----------------------------------------
app.get('/api/admin/pending-requests', async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ status: 'pending' })
      .populate('employeeId', 'name employeeCode jobGrade leaveBalances')
      .sort({ createdAt: 1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الطلبات', error: error.message });
  }
});

// ----------------------------------------
// [مسار الإدارة]: قبول أو رفض طلب
// ----------------------------------------
app.post('/api/admin/handle-request', async (req, res) => {
  try {
    const { requestId, action } = req.body;
    if (!requestId || !action) return res.status(400).json({ message: 'بيانات ناقصة!' });

    const request = await LeaveRequest.findById(requestId).populate('employeeId');
    if (!request) return res.status(404).json({ message: 'الطلب غير موجود!' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'تمت معالجة الطلب مسبقاً!' });

    const user = request.employeeId;

    if (action === 'approve') {
      if (user.leaveBalances[request.leaveType] < request.duration) {
        return res.status(400).json({ message: 'رصيد الموظف لا يكفي!' });
      }
      user.leaveBalances[request.leaveType] -= request.duration;
      await user.save();
      request.status = 'approved';
    } else {
      request.status = 'rejected';
    }

    await request.save();

    const newLog = new Log({
      action: action === 'approve' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED',
      details: `تم ${action === 'approve' ? 'قبول' : 'رفض'} إجازة ${user.name}.`,
      ipAddress: req.ip
    });
    await newLog.save();

    res.status(200).json({ message: `تم ${action === 'approve' ? 'قبول' : 'رفض'} الطلب!` });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في المعالجة', error: error.message });
  }
});

// ----------------------------------------
// [مسار الإدارة]: جلب جميع الموظفين والمديرين
app.get('/api/admin/employees', async (req, res) => {
  try {
    // التعديل الصحيح: استبعاد الأسماء الافتراضية للنظام فقط وليس صلاحية الـ admin
    const employees = await User.find({
      name: { $nin: ['أدمن', 'ادمن', 'admin', 'Admin'] }
    })
    .collation({ locale: "en_US", numericOrdering: true })
    .sort({ employeeCode: 1 });
    
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الجلب', error: error.message });
  }
});

// ----------------------------------------
// 🛡️ [مسار الإدارة]: تعديل بيانات مستخدم (مع حماية الأدمن الذهبي)
// ----------------------------------------
app.put('/api/admin/update-employee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, jobGrade, workType, role } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود!' });

    // منع التلاعب بصلاحية الأدمن الذهبي (1111 أو admin)
    if ((user.employeeCode === '1111' || user.employeeCode === 'admin') && role !== 'admin') {
      return res.status(403).json({ message: 'مرفوض: لا يمكن تجريد الأدمن الذهبي من صلاحياته!' });
    }

    user.name = name || user.name;
    user.role = role || user.role;
    
    // التعديل الذكي بناء على نوع الصلاحية
    if (user.role === 'admin') {
      user.jobGrade = undefined;
      user.workType = undefined;
    } else {
      user.jobGrade = jobGrade || user.jobGrade;
      user.workType = workType || user.workType;
      if (jobGrade) {
        user.leaveBalances.annual = (jobGrade === 'كبير' || jobGrade === 'درجة اولى') ? 30 : 21;
      }
    }

    await user.save();

    const newLog = new Log({
      action: 'EMPLOYEE_UPDATED',
      details: `تعديل بيانات: ${user.name}`,
      ipAddress: req.ip
    });
    await newLog.save();

    res.status(200).json({ message: 'تم التحديث بنجاح!' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في التحديث', error: error.message });
  }
});

// ----------------------------------------
// 🛡️ [مسار الإدارة]: حذف مستخدم نهائياً (مع حماية الأدمن الذهبي)
// ----------------------------------------
app.delete('/api/admin/delete-employee/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود!' });

    // حماية الأدمن الذهبي من الحذف
    if (user.employeeCode === '1111' || user.employeeCode === 'admin') {
      return res.status(403).json({ message: 'تحذير أمني: يمنع حذف حساب الأدمن الذهبي للنظام!' });
    }

    await User.findByIdAndDelete(id);
    await LeaveRequest.deleteMany({ employeeId: id });

    const newLog = new Log({
      action: 'EMPLOYEE_DELETED',
      details: `حذف نهائي: ${user.name}`,
      ipAddress: req.ip
    });
    await newLog.save();

    res.status(200).json({ message: 'تم الحذف بنجاح!' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء الحذف', error: error.message });
  }
});

// ----------------------------------------
// [مسار الإدارة]: تعديل الأرصدة يدوياً
// ----------------------------------------
app.put('/api/admin/update-balances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { annual, casual, compensation } = req.body;

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'الموظف غير موجود!' });

    if (user.role === 'admin') {
      return res.status(400).json({ message: 'ليس للمديرين أرصدة إجازات للتعديل!' });
    }

    user.leaveBalances.annual = Number(annual);
    user.leaveBalances.casual = Number(casual);
    user.leaveBalances.compensation = Number(compensation);
    
    await user.save();

    const newLog = new Log({
      action: 'BALANCES_UPDATED',
      details: `تعديل أرصدة (${user.name})`,
      ipAddress: req.ip
    });
    await newLog.save();

    res.status(200).json({ message: 'تم التحديث بنجاح!' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في التحديث', error: error.message });
  }
});

// ----------------------------------------
// [مسار الإدارة]: جلب السجلات والأرشيف
// ----------------------------------------
app.get('/api/admin/logs', async (req, res) => {
  try {
    const logs = await Log.find().sort({ createdAt: -1 }).limit(200);
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب السجلات', error: error.message });
  }
});

app.get('/api/admin/leave-archive', async (req, res) => {
  try {
    const requests = await LeaveRequest.find()
      .populate('employeeId', 'name employeeCode jobGrade')
      .sort({ createdAt: -1 }); 
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الأرشيف', error: error.message });
  }
});

// ----------------------------------------
// [مسار المستخدم]: تغيير كلمة المرور 
// ----------------------------------------
app.put('/api/auth/change-password', async (req, res) => {
  try {
    const { employeeCode, currentPassword, newPassword } = req.body;
    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'يجب أن تكون كلمة المرور مختلفة!' });
    }

    const user = await User.findOne({ employeeCode });
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود!' });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة!' });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    res.status(200).json({ message: 'تم التغيير بنجاح!' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في السيرفر', error: error.message });
  }
});

// تشغيل الخادم
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 server is running on port: ${PORT}`);
});