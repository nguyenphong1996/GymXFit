import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

const SpecialUtilities = ({ items = [] }) => {
  return (
    <View style={styles.grid}>
      {items.map(item => (
        <TouchableOpacity
          key={item.label}
          activeOpacity={0.8}
          style={styles.item}
        >
          <View style={[styles.iconWrap, { backgroundColor: item.color + '10' }]}> 
            <MaterialIcons name={item.icon} size={20} color={item.color} />
          </View>
          <Text numberOfLines={2} style={styles.label}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  item: {
    width: '31%',
    flexDirection: 'column',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingVertical: 3,
    paddingHorizontal: 4,
    marginBottom: 4,
    elevation: 1,
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    textAlign: 'center',
    fontSize: 12,
    color: '#122214',
  },
});

export default SpecialUtilities;
