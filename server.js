// server.js
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Log = require('./models/Log');
const LeaveRequest = require('./models/LeaveRequest');
const Admin = require('./models/Admin');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('=== ✅ connected to MongoDB successfully ==='))
  .catch((err) => console.error('❌ Error when connecting to MongoDB:', err.message));

app.post('/api/admin/add-employee', async (req, res) => {
  try {
    const { employeeCode, name, role, jobGrade, workType, compensationBalance } = req.body;
    
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
        casual: role === 'admin' ? 0 : 7,
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

app.post('/api/auth/register', async (req, res) => {
  try {
    const { employeeCode, password } = req.body;
    if (!employeeCode || !password) return res.status(400).json({ message: 'برجاء إدخال كود الموظف وكلمة المرور الجديدة!' });

    const user = await User.findOne({ employeeCode });
    if (!user) return res.status(404).json({ message: 'الكود غير مسجل بالنظام!' });
    if (user.isRegistered) return res.status(400).json({ message: 'هذا الحساب مفعل ومسجل بالفعل!' });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user.password = hashedPassword;
    user.isRegistered = true;
    await user.save();

    const newLog = new Log({ action: 'USER_REGISTERED', performedBy: user._id, details: `المستخدم ${user.name} قام بتفعيل حسابه.`, ipAddress: req.ip });
    await newLog.save();

    res.status(200).json({ message: 'تم تفعيل حسابك بنجاح!' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء التسجيل', error: error.message });
  }
});

// ----------------------------------------
// 3. [مسار تسجيل الدخول المزدوج]: Login
// ----------------------------------------
app.post('/api/auth/login', async (req, res) => {
  try {
    const { employeeCode, password } = req.body; // بنستقبل اللي جاي من الشاشة (سواء كود أو اسم مستخدم)

    if (!employeeCode || !password) {
      return res.status(400).json({ message: 'برجاء إدخال اسم المستخدم/الكود وكلمة المرور!' });
    }

    // 1. ندور في جدول الإدارة الأول
    const adminUser = await Admin.findOne({ username: employeeCode });
    if (adminUser) {
      const isMatch = await bcrypt.compare(password, adminUser.password);
      if (!isMatch) return res.status(400).json({ message: 'بيانات الدخول غير صحيحة!' });

      return res.status(200).json({
        message: 'تم تسجيل الدخول بنجاح كمدير نظام!',
        user: {
          id: adminUser._id,
          employeeCode: adminUser.username,
          name: adminUser.name,
          role: adminUser.role
        }
      });
    }

    // 2. لو ملقيناهوش في الإدارة، ندور في جدول الموظفين
    const regularUser = await User.findOne({ employeeCode });
    if (!regularUser) {
      return res.status(400).json({ message: 'الحساب غير مسجل بالنظام!' });
    }

    if (!regularUser.isRegistered) {
      return res.status(400).json({ message: 'هذا الحساب غير مفعل بعد!' });
    }

    const isMatch = await bcrypt.compare(password, regularUser.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'بيانات الدخول غير صحيحة!' });
    }

    res.status(200).json({
      message: 'تم تسجيل الدخول بنجاح!',
      user: {
        id: regularUser._id,
        employeeCode: regularUser.employeeCode,
        name: regularUser.name,
        role: regularUser.role,
        leaveBalances: regularUser.leaveBalances
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الدخول', error: error.message });
  }
});

app.post('/api/admin/reset-password', async (req, res) => {
  try {
    const { employeeCode } = req.body;
    if (employeeCode === 'admin') return res.status(403).json({ message: 'محظور تصفير الأدمن الذهبي!' });

    // 1. لو أدمن، هنرجع باسوورده للقيمة الافتراضية 123456
    const admin = await Admin.findOne({ username: employeeCode });
    if (admin) {
      const salt = await bcrypt.genSalt(10);
      admin.password = await bcrypt.hash('123456', salt);
      await admin.save();
      return res.status(200).json({ message: `تم إعادة كلمة مرور المدير (${admin.name}) للباسوورد الافتراضي: 123456` });
    }

    // 2. لو موظف عادي، بنمشي على اللوجيك القديم بتاعه
    const user = await User.findOne({ employeeCode });
    if (!user) return res.status(404).json({ message: 'المستهدف غير موجود بالنظام!' });

    user.password = undefined;
    user.isRegistered = false;
    await user.save();
    res.status(200).json({ message: `تم تصفير حساب الموظف (${user.name}) بنجاح.` });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في السيرفر', error: error.message });
  }
});

app.post('/api/leaves/request', async (req, res) => {
  try {
    const { employeeCode, leaveType, startDate, endDate, reason } = req.body;
    if (!employeeCode || !leaveType || !startDate || !endDate) return res.status(400).json({ message: 'برجاء استكمال جميع البيانات الأساسية للطلب!' });

    const user = await User.findOne({ employeeCode });
    if (!user) return res.status(404).json({ message: 'الموظف غير موجود!' });
    if (user.role === 'admin') return res.status(400).json({ message: 'غير مسموح لمدير النظام بتقديم طلبات إجازة.' });

    const start = new Date(startDate); start.setHours(0, 0, 0, 0);
    const end = new Date(endDate); end.setHours(0, 0, 0, 0);
    const today = new Date(); today.setHours(0, 0, 0, 0);

    if (end < start) return res.status(400).json({ message: 'تاريخ نهاية الإجازة لا يمكن أن يكون قبل تاريخ البداية!' });
    if (leaveType !== 'casual' && start < today) return res.status(400).json({ message: 'لا يمكن تقديم إجازة بأثر رجعي (يُسمح بذلك للإجازة العارضة فقط)!' });

    const overlappingRequest = await LeaveRequest.findOne({ employeeId: user._id, status: { $ne: 'rejected' }, $or: [ { startDate: { $lte: end }, endDate: { $gte: start } } ] });
    if (overlappingRequest) return res.status(400).json({ message: 'لديك بالفعل طلب إجازة يتعارض مع هذه التواريخ!' });

    const diffTime = Math.abs(end - start);
    const duration = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    if (leaveType === 'casual') {
      if (duration > 2) return res.status(400).json({ message: 'الإجازة العارضة لا يمكن أن تتجاوز يومين متصلين!' });
      const startOfMonth = new Date(start.getFullYear(), start.getMonth(), 1);
      const endOfMonth = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      const monthLeaves = await LeaveRequest.find({ employeeId: user._id, leaveType: 'casual', status: { $ne: 'rejected' }, startDate: { $gte: startOfMonth, $lte: endOfMonth } });
      const takenCasualDaysThisMonth = monthLeaves.reduce((total, req) => total + req.duration, 0);
      if (takenCasualDaysThisMonth + duration > 2) return res.status(400).json({ message: `عفواً، لقد استنفذت الحد الأقصى للعارضة هذا الشهر (متبقي لك ${2 - takenCasualDaysThisMonth} يوم).` });
    }

    if (user.leaveBalances[leaveType] < duration) return res.status(400).json({ message: `رصيدك الحالي (${user.leaveBalances[leaveType]} أيام) لا يكفي لطلب ${duration} يوم!` });

    const newLeaveReq = new LeaveRequest({ employeeId: user._id, leaveType, startDate: start, endDate: end, duration, reason });
    await newLeaveReq.save();

    const newLog = new Log({ action: 'LEAVE_REQUESTED', performedBy: user._id, details: `قدم ${user.name} طلب إجازة (${leaveType}) لمدة ${duration} أيام.`, ipAddress: req.ip });
    await newLog.save();

    res.status(201).json({ message: 'تم تقديم طلب الإجازة بنجاح.', durationRequested: duration, requestDetails: newLeaveReq });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ أثناء تقديم الطلب', error: error.message });
  }
});

app.post('/api/leaves/report', async (req, res) => {
  try {
    const { employeeCode, startDate, endDate } = req.body;
    if (!employeeCode || !startDate || !endDate) return res.status(400).json({ message: 'بيانات التقرير ناقصة!' });

    const user = await User.findOne({ employeeCode });
    if (!user) return res.status(404).json({ message: 'الموظف غير موجود!' });

    const fromDate = new Date(startDate); fromDate.setHours(0, 0, 0, 0);
    const toDate = new Date(endDate); toDate.setHours(23, 59, 59, 999); 

    const leaves = await LeaveRequest.find({ employeeId: user._id, status: 'approved', startDate: { $gte: fromDate }, endDate: { $lte: toDate } }).sort({ startDate: 1 });

    const summary = { annual: 0, casual: 0, compensation: 0 };
    leaves.forEach(leave => { if (summary[leave.leaveType] !== undefined) summary[leave.leaveType] += leave.duration; });

    res.status(200).json({ message: 'تم استخراج التقرير بنجاح.', employeeName: user.name, period: { from: startDate, to: endDate }, totalConsumedDays: summary, detailedLeaves: leaves });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء استخراج التقرير', error: error.message });
  }
});

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

app.get('/api/admin/pending-requests', async (req, res) => {
  try {
    const requests = await LeaveRequest.find({ status: 'pending' }).populate('employeeId', 'name employeeCode jobGrade leaveBalances').sort({ createdAt: 1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب الطلبات', error: error.message });
  }
});

app.post('/api/admin/handle-request', async (req, res) => {
  try {
    const { requestId, action } = req.body;
    if (!requestId || !action) return res.status(400).json({ message: 'بيانات ناقصة!' });

    const request = await LeaveRequest.findById(requestId).populate('employeeId');
    if (!request) return res.status(404).json({ message: 'الطلب غير موجود!' });
    if (request.status !== 'pending') return res.status(400).json({ message: 'تمت معالجة الطلب مسبقاً!' });

    const user = request.employeeId;

    if (action === 'approve') {
      if (user.leaveBalances[request.leaveType] < request.duration) return res.status(400).json({ message: 'رصيد الموظف لا يكفي!' });
      user.leaveBalances[request.leaveType] -= request.duration;
      await user.save();
      request.status = 'approved';
    } else {
      request.status = 'rejected';
    }
    await request.save();

    const newLog = new Log({ action: action === 'approve' ? 'LEAVE_APPROVED' : 'LEAVE_REJECTED', details: `تم ${action === 'approve' ? 'قبول' : 'رفض'} إجازة ${user.name}.`, ipAddress: req.ip });
    await newLog.save();

    res.status(200).json({ message: `تم ${action === 'approve' ? 'قبول' : 'رفض'} الطلب!` });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في المعالجة', error: error.message });
  }
});

// ----------------------------------------
// [التعديل هنا] - استبعاد اسم "أدمن" أو "admin" من الإرسال للواجهة
// ----------------------------------------
app.get('/api/admin/employees', async (req, res) => {
  try {
    // جلب الكل بدون أي فلترة من السيرفر
    const employees = await User.find().sort({ employeeCode: 1 });
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الجلب', error: error.message });
  }
});

app.put('/api/admin/update-employee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, jobGrade, workType, role } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود!' });
    if ((user.employeeCode === '1111' || user.employeeCode === 'admin') && role !== 'admin') return res.status(403).json({ message: 'مرفوض: لا يمكن تجريد الأدمن الذهبي من صلاحياته!' });

    user.name = name || user.name;
    user.role = role || user.role;
    
    if (user.role === 'admin') {
      user.jobGrade = undefined;
      user.workType = undefined;
    } else {
      user.jobGrade = jobGrade || user.jobGrade;
      user.workType = workType || user.workType;
      if (jobGrade) user.leaveBalances.annual = (jobGrade === 'كبير' || jobGrade === 'درجة اولى') ? 30 : 21;
    }
    await user.save();

    const newLog = new Log({ action: 'EMPLOYEE_UPDATED', details: `تعديل بيانات: ${user.name}`, ipAddress: req.ip });
    await newLog.save();
    res.status(200).json({ message: 'تم التحديث بنجاح!' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في التحديث', error: error.message });
  }
});

app.delete('/api/admin/delete-employee/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'المستخدم غير موجود!' });
    if (user.employeeCode === '1111' || user.employeeCode === 'admin') return res.status(403).json({ message: 'تحذير أمني: يمنع حذف حساب الأدمن الذهبي للنظام!' });

    await User.findByIdAndDelete(id);
    await LeaveRequest.deleteMany({ employeeId: id });

    const newLog = new Log({ action: 'EMPLOYEE_DELETED', details: `حذف نهائي: ${user.name}`, ipAddress: req.ip });
    await newLog.save();
    res.status(200).json({ message: 'تم الحذف بنجاح!' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء الحذف', error: error.message });
  }
});

app.put('/api/admin/update-balances/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { annual, casual, compensation } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: 'الموظف غير موجود!' });
    if (user.role === 'admin') return res.status(400).json({ message: 'ليس للمديرين أرصدة إجازات للتعديل!' });

    user.leaveBalances.annual = Number(annual);
    user.leaveBalances.casual = Number(casual);
    user.leaveBalances.compensation = Number(compensation);
    await user.save();

    const newLog = new Log({ action: 'BALANCES_UPDATED', details: `تعديل أرصدة (${user.name})`, ipAddress: req.ip });
    await newLog.save();
    res.status(200).json({ message: 'تم التحديث بنجاح!' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في التحديث', error: error.message });
  }
});

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
    const requests = await LeaveRequest.find().populate('employeeId', 'name employeeCode jobGrade').sort({ createdAt: -1 }); 
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في الأرشيف', error: error.message });
  }
});

// ----------------------------------------
// [مسار المستخدم/الأدمن]: تغيير كلمة المرور من صفحة حسابي
// ----------------------------------------
app.put('/api/auth/change-password', async (req, res) => {
  try {
    const { employeeCode, currentPassword, newPassword } = req.body; 
    // ملاحظة: employeeCode هنا شايل إما كود الموظف، أو اسم المستخدم (username) بتاع الأدمن

    if (currentPassword === newPassword) {
      return res.status(400).json({ message: 'كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية!' });
    }

    let account = null;

    // 1. ندور في جدول الإدارة (Admins) الأول
    account = await Admin.findOne({ username: employeeCode });
    
    // 2. لو ملقيناهوش، ندور في جدول الموظفين (Users)
    if (!account) {
      account = await User.findOne({ employeeCode });
    }

    // 3. لو مش موجود في الجدولين
    if (!account) {
      return res.status(404).json({ message: 'الحساب غير موجود!' });
    }

    // 4. التأكد من كلمة المرور الحالية (القديمة)
    const isMatch = await bcrypt.compare(currentPassword, account.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'كلمة المرور الحالية غير صحيحة!' });
    }

    // 5. تشفير كلمة المرور الجديدة وحفظها في الجدول الصحيح
    const salt = await bcrypt.genSalt(10);
    account.password = await bcrypt.hash(newPassword, salt);
    await account.save();

    res.status(200).json({ message: 'تم تغيير كلمة المرور بنجاح!' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
});

// ==========================================
// مسارات جدول الإدارة العليا (Admin Collection)
// ==========================================

// 1. [إضافة أدمن جديد]
app.post('/api/admin/create-admin', async (req, res) => {
  try {
    const { username, name, password } = req.body;

    if (!username || !name || !password) {
      return res.status(400).json({ message: 'برجاء إدخال اسم المستخدم، الاسم، والرقم السري!' });
    }

    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ message: 'اسم المستخدم مسجل مسبقاً!' });
    }

    // تشفير الرقم السري قبل الحفظ
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newAdmin = new Admin({
      username,
      name,
      password: hashedPassword,
      role: 'admin' // ثابتة
    });

    await newAdmin.save();
    res.status(201).json({ message: 'تم إضافة مدير النظام بنجاح!' });
  } catch (error) {
    res.status(500).json({ message: 'حدث خطأ في السيرفر', error: error.message });
  }
});

// 2. [جلب كل المديرين لجدول العرض]
app.get('/api/admin/admins-list', async (req, res) => {
  try {
    const admins = await Admin.find().select('-password'); // بنجيب الداتا من غير الباسوورد للأمان
    res.status(200).json(admins);
  } catch (error) {
    res.status(500).json({ message: 'خطأ في جلب بيانات الإدارة', error: error.message });
  }
});

// 3. [تعديل بيانات أدمن]
app.put('/api/admin/update-admin/:id', async (req, res) => {
  try {
    const { name, username } = req.body;
    const admin = await Admin.findById(req.params.id);
    
    if (!admin) return res.status(404).json({ message: 'المدير غير موجود!' });

    // حماية اسم المستخدم للأدمن الذهبي من التعديل عشان ميبوظش
    if (admin.username === 'admin' && username !== 'admin') {
      return res.status(403).json({ message: 'لا يمكن تغيير اسم المستخدم للأدمن الذهبي!' });
    }

    admin.name = name || admin.name;
    if (admin.username !== 'admin') {
      admin.username = username || admin.username;
    }

    await admin.save();
    res.status(200).json({ message: 'تم تحديث بيانات المدير بنجاح!' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ في التحديث', error: error.message });
  }
});

// 4. [مسح أدمن]
app.delete('/api/admin/delete-admin/:id', async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id);
    if (!admin) return res.status(404).json({ message: 'المدير غير موجود!' });

    // حماية الأدمن الذهبي من المسح
    if (admin.username === 'admin') {
      return res.status(403).json({ message: 'تحذير أمني: يمنع مسح الأدمن الذهبي للنظام!' });
    }

    await Admin.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'تم مسح حساب المدير نهائياً!' });
  } catch (error) {
    res.status(500).json({ message: 'خطأ أثناء المسح', error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 server is running on port: ${PORT}`);
});