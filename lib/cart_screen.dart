
import 'package:flutter/material.dart';

class CartScreen extends StatefulWidget {
  final List<Map<String, String>> cartItems;

  const CartScreen({Key? key, required this.cartItems}) : super(key: key);

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  
  // تغطية كافة محافظات العراق
  String _selectedGovernorate = 'ديالى (بعقوبة)';
  final List<String> _iraqiGovernorates = [
    'بغداد',
    'ديالى (بعقوبة)',
    'البصرة',
    'نينوى',
    'أربيل',
    'السليمانية',
    'كركوك',
    'صلاح الدين',
    'الأنبار',
    'بابل',
    'كربلاء',
    'النجف',
    'الديوانية',
    'ميسان',
    'ذي قار',
    'المثنى',
    'واسط'
  ];

  String _deliveryType = 'دراجة نارية (داخل المحافظة)';
  String _selectedPartnerCompany = 'شركة الغدير المركزية للتوصيل';

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  double _calculateTotal() {
    double total = 0.0;
    try {
      for (var item in widget.cartItems) {
        String priceStr = item['price'] ?? '0';
        double price = double.tryParse(priceStr.replaceAll(RegExp(r'[^0-9.]'), '')) ?? 0.0;
        total += price;
      }
    } catch (e) {
      total = 0.0;
    }
    return total;
  }

  // نافذة تسجيل شركة توصيل خارجية والربط مع سيستمهم
  void _showPartnerIntegrationDialog(BuildContext context) {
    final sysNameController = TextEditingController();
    final apiKeyController = TextEditingController();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('ربط سيستم شركة التوصيل الخارجية'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('أدخل تفاصيل نظام الشركة لتتم مزامنة وتحويل طلبات المحافظات أوتوماتيكياً:'),
            const SizedBox(height: 10),
            TextField(
              controller: sysNameController,
              decoration: const InputDecoration(labelText: 'اسم شركة الشحن', border: OutlineInputBorder()),
            ),
            const SizedBox(height: 10),
            TextField(
              controller: apiKeyController,
              decoration: const InputDecoration(labelText: 'مفتاح الربط البرمجى (API Key)', border: OutlineInputBorder()),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('إلغاء'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('تم ربط النظام بنجاح، سيتم إرسال طلبات المحافظات إلى سيستم الشركة القريب لاستلامها!'),
                  backgroundColor: Colors.green,
                ),
              );
            },
            child: const Text('حفظ الربط والاعتماد'),
          ),
        ],
      ),
    );
  }

  // إرسال الطلب وتحويله لسيستم شركة الشحن المختارة
  void _submitOrderToDeliverySystem(BuildContext context) {
    final name = _nameController.text.trim();
    final phone = _phoneController.text.trim();
    final address = _addressController.text.trim();

    if (name.isEmpty  phone.isEmpty  address.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('يرجى ملء كافة حقول الاسم والهاتف والعنوان'),
          backgroundColor: Colors.orange,
        ),
      );
      return;
    }

    showDialog(
      context: context,
      builder: (context) => AlertDialog(

title: const Text('تم توجيه الطلب بنجاح'),
        content: Text(
          'العميل: $name\n'
          'الهاتف: $phone\n'
          'المحافظة المستهدفة: $_selectedGovernorate\n'
          'العنوان: $address\n'
          'شركة الشحن المرتبطة: $_selectedPartnerCompany\n\n'
          'تم تحويل بيانات الطلب إلى سستم الشركة لكي يتم إرسال مندوب لاستلامه وتوصيله للزبون.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              Navigator.pop(context);
            },
            child: const Text('حسناً'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    double total = _calculateTotal();

    return Scaffold(
      appBar: AppBar(
        title: const Text('سلة الطلبات وشحن المحافظات - الغدير'),
        centerTitle: true,
      ),
      body: widget.cartItems.isEmpty
          ? const Center(
              child: Text(
                'السلة فارغة حالياً',
                style: TextStyle(fontSize: 18, color: Colors.grey),
              ),
            )
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'المنتجات المختارة:',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  ListView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: widget.cartItems.length,
                    itemBuilder: (context, index) {
                      final item = widget.cartItems[index];
                      return Card(
                        margin: const EdgeInsets.symmetric(vertical: 4),
                        child: ListTile(
                          title: Text(item['name'] ?? 'منتج'),
                          subtitle: Text(item['price'] ?? '0 د.ع'),
                        ),
                      );
                    },
                  ),
                  const Divider(height: 30, thickness: 2),

                  // اختيار المحافظة الجغرافية
                  const Text(
                    'اختر المحافظة المستهدفة في العراق:',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _selectedGovernorate,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.map, color: Colors.blue),
                    ),
                    items: _iraqiGovernorates.map((gov) {
                      return DropdownMenuItem(value: gov, child: Text(gov));
                    }).toList(),
                    onChanged: (val) => setState(() => _selectedGovernorate = val!),
                  ),
                  const SizedBox(height: 12),

                  TextField(
                    controller: _nameController,
                    decoration: const InputDecoration(labelText: 'اسم الزبون الكامل', border: OutlineInputBorder(), prefixIcon: Icon(Icons.person)),
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: _phoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(labelText: 'رقم الهاتف', border: OutlineInputBorder(), prefixIcon: Icon(Icons.phone)),
                  ),
                  const SizedBox(height: 12),

TextField(
                    controller: _addressController,
                    decoration: const InputDecoration(labelText: 'العنوان التفصيلي (المنطقة، الشارع)', border: OutlineInputBorder(), prefixIcon: Icon(Icons.location_on)),
                  ),
                  const SizedBox(height: 15),

                  // ربط سيستم شركات الشحن المحافظات
                  const Text(
                    'شركة التوصيل المرتبطة لإرسال الطلب:',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  DropdownButtonFormField<String>(
                    value: _selectedPartnerCompany,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.local_shipping, color: Colors.orange),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'شركة الغدير المركزية للتوصيل',
                        child: Text('شركة الغدير المركزية للتوصيل (خاص ببعقوبة وديالى)'),
                      ),
                      DropdownMenuItem(
                        value: 'شركة شحن المحافظات المرتبطة',
                        child: Text('شركة الشحن السريع للمحافظات (ربط مباشر بالسيستم)'),
                      ),
                    ],
                    onChanged: (val) => setState(() => _selectedPartnerCompany = val!),
                  ),
                  const SizedBox(height: 8),
                  Center(
                    child: TextButton.icon(
                      icon: const Icon(Icons.settings_input_component, color: Colors.blue),
                      label: const Text('تسجيل أو ربط سيستم شركة توصيل جديدة للمحافظات'),
                      onPressed: () => _showPartnerIntegrationDialog(context),
                    ),
                  ),

                  const SizedBox(height: 15),
                  const Text(
                    'وسيلة الشحن والنقل:',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  DropdownButtonFormField<String>(
                    value: _deliveryType,
                    decoration: const InputDecoration(
                      border: OutlineInputBorder(),
                      prefixIcon: Icon(Icons.airport_shuttle),
                    ),
                    items: const [
                      DropdownMenuItem(
                        value: 'دراجة نارية (داخل المحافظة)',
                        child: Text('دراجة نارية للتوصيل السريع الداخلي'),
                      ),
                      DropdownMenuItem(
                        value: 'سيارة نقل كبيرة (شحن أثاث ومحافظات)',
                        child: Text('سيارة نقل كبرى (للأجهزة والأثاث والشحن بين المحافظات)'),
                      ),
                    ],
                    onChanged: (val) => setState(() => _deliveryType = val!),
                  ),
                  const SizedBox(height: 20),
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.grey.shade300),
                    ),
                    child: Column(
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            const Text('المجموع الكلي:', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
                            Text('$total د.ع', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green)),

],
                        ),
                        const SizedBox(height: 15),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.blue[800],
                              padding: const EdgeInsets.symmetric(vertical: 14),
                            ),
                            onPressed: () => _submitOrderToDeliverySystem(context),
                            child: const Text(
                              'إرسال الطلب وتحويله لسيستم شركة الشحن',
                              style: TextStyle(fontSize: 16, color: Colors.white, fontWeight: FontWeight.bold),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
    );
  }
}
